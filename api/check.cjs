const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking URL:', supabaseUrl);
  const { data, error } = await supabase.from('leads').select('*').limit(1);
  if (error) {
    console.error('Error:', error.message, error.details);
  } else {
    console.log('Success! Table "leads" found.');
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('Table is empty.');
    }
  }
}

check();
