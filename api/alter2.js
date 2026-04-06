import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:%40Argho25%23@db.dukdfodkgsztxwisfajt.supabase.co:5432/postgres'
});

async function run() {
  try {
    console.log('Connecting to active db...');
    const client = await pool.connect();
    console.log('Connected');
    
    await client.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS last_note TEXT;
    `);
    
    console.log('Successfully altered leads table.');
    client.release();
  } catch (e) {
    console.error('Error altering table:', e);
  } finally {
    pool.end();
  }
}

run();
