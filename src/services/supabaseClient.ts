import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ========================
// Environmental Variables
// ========================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

declare global {
	interface Window {
		__interntrack_supabase__?: SupabaseClient<any>;
	}
}

const noOpLock = async <T>(
	_name: string,
	_acquireTimeout: number,
	fn: () => Promise<T>
) => fn();

// Connection Engine (browser singleton to avoid multiple GoTrueClient instances)
export const supabase: SupabaseClient<any> = window.__interntrack_supabase__ ?? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
		lock: noOpLock,
	},
});
window.__interntrack_supabase__ = supabase;

// Admin Client (Optional - for privileged operations)
const SERVICE_ROLE = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = SERVICE_ROLE
	? createClient(SUPABASE_URL, SERVICE_ROLE, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	})
	: null;

