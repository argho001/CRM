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

async function testQuery() {
  const { data, error } = await supabase
    .from('leads')
    .select('id, business_name, phone, email, whatsapp, address, platform, category, has_website, website_url, map_url, followers_count, rating, review_count, last_review_days_ago, score, status, response_status, handled_by, handled_at, created_at')
    .limit(1);

  if (error) {
    console.log('QUERY FAILED:', error);
  } else {
    console.log('QUERY SUCCEEDED:', data);
  }
  
  // Test Update
  const { data: updateData, error: updateError } = await supabase
    .from('leads')
    .update({ handled_by: 'test-user' })
    .eq('id', '055fa437-d0e8-46c2-9749-87e4fbbec163')
    .select('id, business_name')
    .single();
    
  if (updateError) {
    console.log('UPDATE FAILED:', updateError);
  } else {
    console.log('UPDATE SUCCEEDED:', updateData);
  }
}

testQuery();
