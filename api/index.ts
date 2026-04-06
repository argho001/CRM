import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env only in local dev
if (process.env.NODE_ENV !== 'production') {
  const rootEnvPath = path.resolve(__dirname, '../.env');
  dotenv.config({ path: rootEnvPath });
}

// Environment Variable Check
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Initialize Supabase Client (Safe check)
let supabase: any = null;
try {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[MISSING CONFIG]: SUPABASE_URL or SUPABASE_KEY is missing in environment variables.');
  } else {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (e: any) {
  console.error('[CRITICAL]: Failed to initialize Supabase client:', e.message);
}

const app = express();
app.use(cors());
app.use(express.json());

// Helper middleware to ensure DB connection is ready
const checkDb = (req: any, res: any, next: any) => {
  if (!supabase) {
    return res.status(500).json({ 
      error: 'Backend configuration error: Supabase connection not initialized.',
      details: 'Check your Vercel Environment Variables for SUPABASE_URL and SUPABASE_KEY.'
    });
  }
  next();
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get Activity History
app.get('/api/history', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lead_updates')
      .select(`
        id,
        old_status,
        new_status,
        note,
        updated_at,
        updated_by,
        lead:leads(business_name)
      `)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get All Leads
app.get('/api/leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id, business_name, phone, email, whatsapp, address, platform, category, has_website, website_url, map_url, followers_count, rating, review_count, last_review_days_ago, score, status, response_status, handled_by, handled_at, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // FETCH LATEST NOTES WORKAROUND
    // Since leads table doesn't have last_note, we fetch from lead_updates
    const leadIds = data.map((l: any) => l.id);
    const { data: notes, error: notesError } = await supabase
      .from('lead_updates')
      .select('lead_id, note, updated_at')
      .in('lead_id', leadIds)
      .order('updated_at', { ascending: false });

    if (!notesError && notes) {
      // Map notes to leads
      const notesMap = new Map();
      notes.forEach((n: any) => {
        if (!notesMap.has(n.lead_id)) {
          notesMap.set(n.lead_id, { last_contacted_at: n.updated_at, last_note: null });
        }
        
        // If this update has a note and we haven't found a note for this lead yet, store it
        const current = notesMap.get(n.lead_id);
        if (n.note && n.note.trim() !== '' && !current.last_note) {
          current.last_note = n.note;
          // Also set the contacted_at to the date of THIS note specifically if we want the "note date"
          current.last_contacted_at = n.updated_at; 
        }
      });

      const mergedData = data.map((l: any) => ({
        ...l,
        ...(notesMap.get(l.id) || {})
      }));
      return res.json(mergedData);
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leads from Supabase' });
  }
});

// Update Lead Status
app.patch('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response_status, handled_by, note, last_note, last_contacted_at } = req.body;

    // Get old lead for history
    const { data: oldLead, error: fetchError } = await supabase
      .from('leads')
      .select('id, business_name, phone, email, whatsapp, address, platform, category, has_website, website_url, map_url, followers_count, rating, review_count, last_review_days_ago, score, status, response_status, handled_by, handled_at, created_at')
      .eq('id', id)
      .single();

    if (fetchError || !oldLead) return res.status(404).json({ error: 'Lead not found' });

    // Update Lead - SCHEMALESS NOTE WORKAROUND
    const updateData: any = {
      status: status || undefined,
      response_status: response_status || undefined,
      handled_by: handled_by || undefined,
      handled_at: status ? new Date().toISOString() : undefined,
      // Removed last_note and last_contacted_at as they don't exist in the leads table
    };

    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select('id, business_name, phone, email, whatsapp, address, platform, category, has_website, website_url, map_url, followers_count, rating, review_count, last_review_days_ago, score, status, response_status, handled_by, handled_at, created_at')
      .single();

    if (updateError) {
      console.error('[Update Error]:', updateError.message);
      throw updateError;
    }

    // Record Update History if status, response_status, or last_note changed
    const statusChanged = status && status !== oldLead.status;
    const responseStatusChanged = response_status && response_status !== oldLead.response_status;
    const hasNote = last_note || note;

    if ((statusChanged || responseStatusChanged || hasNote) && handled_by) {
      const { error: historyError } = await supabase.from('lead_updates').insert({
        lead_id: id,
        updated_by: handled_by,
        old_status: statusChanged ? oldLead.status : (responseStatusChanged ? oldLead.response_status : (oldLead.status || 'new')),
        new_status: statusChanged ? status : (responseStatusChanged ? response_status : (oldLead.status || 'new')),
        note: last_note || note || '',
      });
      if (historyError) console.error('[History Error]:', historyError.message);
    }

    // Manually attach the note to the response for immediate UI update
    const result = {
      ...updatedLead,
      last_note: last_note || note || oldLead.last_note,
      last_contacted_at: last_contacted_at || (hasNote ? new Date().toISOString() : oldLead.last_contacted_at)
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Create Lead (with Duplicate Check)
app.post('/api/leads', async (req, res) => {
  try {
    const data = req.body;
    let { business_name, phone } = data;
    
    // Normalize inputs
    business_name = business_name?.trim() || '';
    phone = phone?.trim() || '';

    if (!business_name) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    // Build smart duplicate check filter
    // Standardize: Name check (case-insensitive) - ESCAPE COMMAS and reserved chars with double quotes
    let orFilter = `business_name.ilike."${business_name.replace(/"/g, '\\"')}"`;
    
    // Only check phone if it looks like a real number (at least 5 digits/chars)
    if (phone && phone.length >= 5) {
      orFilter += `,phone.eq."${phone.replace(/"/g, '\\"')}"`;
    }

    // Duplicate Check
    const { data: existing, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .or(orFilter)
      .limit(1);

    if (checkError) {
      console.error('[Duplicate Check Error]:', checkError.message, checkError.details);
      throw new Error(`Duplicate check failed: ${checkError.message}`);
    }
    
    if (existing && existing.length > 0) {
      const existingLead = existing[0];
      console.log(`[Upsert]: Updating existing lead: ${business_name} (ID: ${existingLead.id})`);
      
      // Calculate quality score for update too
      let score = 0;
      if (!data.has_website) score += 30;
      if (data.phone) score += 20;
      if (data.email) score += 15;
      if (data.whatsapp) score += 10;
      if (data.followers_count > 1000) score += 10;
      score += 10;
      if (data.rating < 3.5) score += 5;

      const updateData = {
        phone,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        address: data.address || null,
        platform: data.platform || 'google',
        category: data.category || null,
        has_website: !!data.has_website,
        website_url: data.website_url || null,
        map_url: data.map_url || null,
        followers_count: parseInt(data.followers_count) || 0,
        rating: parseFloat(data.rating) || 0,
        review_count: parseInt(data.review_count) || 0,
        last_review_days_ago: parseInt(data.last_review_days_ago) || null,
        score: Math.min(score, 100),
      };

      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', existingLead.id)
        .select('id, business_name, phone, email, whatsapp, address, platform, category, has_website, website_url, map_url, followers_count, rating, review_count, last_review_days_ago, score, status, response_status, handled_by, handled_at, created_at')
        .single();

      if (updateError) {
        console.error('[Upsert Error]:', updateError.message);
        throw new Error(`Update failed: ${updateError.message}`);
      }
      
      return res.status(200).json(updatedLead);
    }

    // Calculate quality score
    let score = 0;
    if (!data.has_website) score += 30;
    if (data.phone) score += 20;
    if (data.email) score += 15;
    if (data.whatsapp) score += 10;
    if (data.followers_count > 1000) score += 10;
    score += 10;
    if (data.rating < 3.5) score += 5;

    // SANITIZE: Only send fields that exist in the database schema
    const cleanData = {
      business_name,
      phone,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      address: data.address || null,
      platform: data.platform || 'google',
      category: data.category || null,
      has_website: !!data.has_website,
      website_url: data.website_url || null,
      map_url: data.map_url || null,
      followers_count: parseInt(data.followers_count) || 0,
      rating: parseFloat(data.rating) || 0,
      review_count: parseInt(data.review_count) || 0,
      last_review_days_ago: parseInt(data.last_review_days_ago) || null,
      score: Math.min(score, 100),
    };

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert(cleanData)
        .select('id, business_name, phone, email, whatsapp, address, platform, category, has_website, website_url, map_url, followers_count, rating, review_count, last_review_days_ago, score, status, response_status, handled_by, handled_at, created_at')
        .single();

    if (insertError) {
      console.error('[Insert Error]:', insertError.message, insertError.details);
      throw new Error(`Insert failed: ${insertError.message}`);
    }
    
    res.status(201).json(newLead);
  } catch (err: any) {
    console.error('[Leads API Error]:', err.message);
    res.status(500).json({ error: err.message || 'Failed to create lead in Supabase' });
  }
});

const PORT = Number(process.env.PORT) || 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

export default app;
