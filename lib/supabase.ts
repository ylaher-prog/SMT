import { createClient } from '@supabase/supabase-js';

// Hardcoded for this prototype environment. In a real app, use environment variables.
const supabaseUrl = 'https://lhvelbppnpycjpmgovxh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodmVsYnBwbnB5Y2pwbWdvdnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzE1MzI4MDAsImV4cCI6MTk4NzEwODgwMH0.1_R3s-gLS8k9sWZ_E9C2gVaqi5yFPajy54LS-x35n58';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
