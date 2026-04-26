import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();


console.log("here supabaseURL:", process.env.SUPABASE_URL)
console.log("KEY:", process.env.SUPABASE_SERVICE_KEY)



const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default supabase;
