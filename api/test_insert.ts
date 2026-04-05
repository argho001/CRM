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

async function testInsert() {
  console.log('Testing lead insertion...');
  const lead = {
    business_name: 'Test Business ' + Date.now(),
    phone: '1234567890',
    status: 'new'
  };

  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();

  if (error) {
    console.error('Insert Error:', error);
    return;
  }

  console.log('Successfully inserted lead:', data.id);
  
  // Now try to delete it to keep it empty
  await supabase.from('leads').delete().eq('id', data.id);
  console.log('Cleaned up test lead.');
}

testInsert();
