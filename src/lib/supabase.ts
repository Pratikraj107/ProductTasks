import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lzbzopkhadklniranyuo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6YnpvcGtoYWRrbG5pcmFueXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNzY2MDgsImV4cCI6MjA1MzY1MjYwOH0.QPYen0-xJqje2ajzYGlrb0U_gv-azQsJ_HiFknO-Sa8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true // required for OAuth redirect (Google) callback
  }
});
