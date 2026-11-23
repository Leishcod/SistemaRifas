import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://hazmgfjnevtdtssthnso.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhem1nZmpuZXZ0ZHRzc3RobnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzOTQyOTAsImV4cCI6MjExMDk3MDI5MH0.M7HP0o_XaQxjce7dc_rZSd3VejuinRq9vDEiHd69Px4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
