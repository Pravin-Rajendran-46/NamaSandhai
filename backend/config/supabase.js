// backend/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tosjqgjhlhefoiaadjvp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Please set SUPABASE_ANON_KEY in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;