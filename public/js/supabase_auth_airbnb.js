globalThis.auth = {}
globalThis.auth.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZWp6Z2x2cXNpeWR5Y3ZpdnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNDgzOTQsImV4cCI6MjA1NzgyNDM5NH0.32ClzsWEgc_XdqXD4d8i7_AO4SOIjKjzQCPb_SjJBoU";
globalThis.auth.SUPABASE_URL = "https://xwejzglvqsiydycvivys.supabase.co/";

globalThis.supabase = window.supabase.createClient(globalThis.auth.SUPABASE_URL, globalThis.auth.SUPABASE_ANON_KEY);