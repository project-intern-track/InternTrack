// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Create a Supabase client with the Auth context of the user making the request
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 2. Authenticate the user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    // 3. Authorization Check: Ensure the requester is an Admin
    // We check the DB profile or the user metadata. DB profile is safer as metadata can be stale.
    const { data: requesterProfile, error: profileError } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (profileError || !requesterProfile || requesterProfile.role !== 'admin') {
         throw new Error('Forbidden: Only admins can perform this action.')
    }

    // 4. Parse Request Body
    const { userId, newRole } = await req.json()

    if (!userId || !newRole) {
      throw new Error('Missing userId or newRole')
    }

    if (!['admin', 'supervisor', 'intern'].includes(newRole)) {
        throw new Error('Invalid role specified')
    }

    // 5. Perform the Update using the Service Role (Admin Context)
    // The localized client above is restricted by RLS. We need the super-admin client here.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // A. Update Auth Metadata (This fixes the session sticky issue)
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { role: newRole } }
    )

    if (authUpdateError) throw authUpdateError

    // B. Update Public Profile (This updates the DB)
    const { error: profileUpdateError } = await supabaseAdmin
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (profileUpdateError) throw profileUpdateError

    return new Response(
      JSON.stringify({ message: `User ${userId} upgraded to ${newRole} successfully.` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
