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

async function checkSchema() {
  console.log('Checking Schema of "leads" table...');
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching leads:', error);
    if (error.code === '42P01') {
      console.log('Table "leads" does NOT exist!');
    }
  } else {
    console.log('Table "leads" exists.');
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('Table is empty. Checking column info via query...');
      // Try to get column info
      const { data: cols, error: colError } = await supabase.rpc('get_column_info', { table_name: 'leads' });
      if (colError) {
        console.log('Col error (you likely need to run the SQL I gave you!):', colError.message);
      } else {
         console.log('Columns:', cols);
      }
    }
  }
}

checkSchema();
