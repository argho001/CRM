import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
  console.log('Checking Supabase Database...');
  const { data, count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total Leads in Database: ${count}`);
  if (data && data.length > 0) {
    console.log('First 3 leads:');
    data.slice(0, 3).forEach(l => {
      console.log(`- ${l.business_name} (${l.phone || 'No Phone'})`);
    });
  } else {
    console.log('Database is EMPTY.');
  }
}

checkDB();
