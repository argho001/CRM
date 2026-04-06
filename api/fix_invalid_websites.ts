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

const isValidUrl = (url: string) => {
  if (!url) return false;
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
  return urlPattern.test(url.trim());
};

async function cleanup() {
  console.log('🚀 Starting Database Cleanup...');
  
  const { data: leads, error } = await supabase.from('leads').select('id, business_name, website_url');
  if (error || !leads) {
    console.error('❌ Error fetching leads:', error);
    return;
  }

  console.log(`🔍 Checking ${leads.length} leads...`);
  
  let clearedCount = 0;
  for (const lead of leads) {
    const url = lead.website_url || '';
    if (url && !isValidUrl(url)) {
      console.log(`🗑️ Clearing invalid website for: ${lead.business_name} | URL: ${url}`);
      
      const { error: updateError } = await supabase
        .from('leads')
        .update({ website_url: null, has_website: false })
        .eq('id', lead.id);
        
      if (updateError) {
        console.error(`❌ Failed to update ${lead.business_name}:`, updateError);
      } else {
        clearedCount++;
      }
    }
  }

  console.log(`✅ Cleanup finished. Cleared ${clearedCount} invalid URLs.`);
}

cleanup();
