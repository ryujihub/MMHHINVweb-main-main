import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ubjfpmpzrquvtflzexmd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViamZwbXB6cnF1dnRmbHpleG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MzAyMDksImV4cCI6MjA3NjAwNjIwOX0.1tAfZBxU_XeOxskDl43bPICOA9rqxTAm0pujMA9Dots'; // This is the "Publishable key" from the Supabase "API Keys" tab.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// You can also export auth and db directly if needed, similar to Firebase
export const auth = supabase.auth;
export const db = supabase; // Supabase client can be used for database operations
