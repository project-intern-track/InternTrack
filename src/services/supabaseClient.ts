import { createClient } from '@supabase/supabase-js';

// ========================
// Environmental Variables
// ========================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

declare global {
	interface Window {
		__interntrack_supabase__?: ReturnType<typeof createClient>;
	}
}

const noOpLock = async <T>(
	_name: string,
	_acquireTimeout: number,
	fn: () => Promise<T>
) => fn();

// Connection Engine (browser singleton to avoid multiple GoTrueClient instances)
export const supabase = window.__interntrack_supabase__ ?? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
		lock: noOpLock,
	},
});
window.__interntrack_supabase__ = supabase;

