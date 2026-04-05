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

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get All Leads
app.get('/api/leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
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
    const { status, response_status, handled_by, note } = req.body;

    // Get old lead for history
    const { data: oldLead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !oldLead) return res.status(404).json({ error: 'Lead not found' });

    // Update Lead
    const updateData: any = {
      status: status || undefined,
      response_status: response_status || undefined,
      handled_by: handled_by || undefined,
      handled_at: status ? new Date().toISOString() : undefined,
    };

    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record Update History if response_status changed
    if (response_status && response_status !== oldLead.response_status && handled_by) {
      await supabase.from('lead_updates').insert({
        lead_id: id,
        updated_by: handled_by,
        old_status: oldLead.response_status,
        new_status: response_status,
        note: note || '',
      });
    }

    res.json(updatedLead);
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
    // Standardize: Name check (case-insensitive)
    let orFilter = `business_name.ilike.${business_name}`;
    
    // Only check phone if it looks like a real number (at least 5 digits/chars)
    if (phone && phone.length >= 5) {
      orFilter += `,phone.eq.${phone}`;
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
      return res.status(409).json({ error: 'Duplicate entry: Name or phone already exists.' });
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

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert({
        ...data,
        business_name,
        phone,
        score: Math.min(score, 100),
      })
      .select()
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
