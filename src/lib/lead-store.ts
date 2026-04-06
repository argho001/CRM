import { Lead, LeadStatus, ResponseStatus, LeadUpdate } from '@/types/crm';

const API_BASE = '/api';

export async function getLeads(): Promise<Lead[]> {
  try {
    const res = await fetch(`${API_BASE}/leads`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
  const leads = await getLeads();
  return leads.filter(l => l.status === status);
}

export async function getNewLeads(): Promise<Lead[]> {
  const leads = await getLeads();
  return leads
    .filter(l => l.status === 'new')
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 50);
}

export async function updateLeadStatus(id: string, status: LeadStatus, userId: string): Promise<Lead | undefined> {
  try {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, handled_by: userId }),
    });
    if (!res.ok) throw new Error('Failed to update lead status');
    return res.json();
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

export async function markLead(id: string, status: 'done' | 'cancelled', userId: string): Promise<Lead | undefined> {
  return updateLeadStatus(id, status as LeadStatus, userId);
}

export async function restoreLead(id: string): Promise<Lead | undefined> {
  try {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'new', handled_by: null }),
    });
    if (!res.ok) throw new Error('Failed to restore lead');
    return res.json();
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

export async function updateResponseStatus(id: string, newStatus: ResponseStatus, userId: string, note: string = ''): Promise<Lead | undefined> {
  try {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_status: newStatus, handled_by: userId, note }),
    });
    if (!res.ok) throw new Error('Failed to update response status');
    return res.json();
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

export async function saveLeadNote(id: string, note: string, userId: string): Promise<Lead | undefined> {
  try {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        last_note: note, 
        last_contacted_at: new Date().toISOString(),
        handled_by: userId
      }),
    });
    if (!res.ok) throw new Error('Failed to save lead note');
    return res.json();
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

export async function addLead(lead: Omit<Lead, 'id' | 'score' | 'status' | 'response_status' | 'handled_by' | 'handled_at' | 'created_at'>): Promise<{ success: boolean; data?: Lead; duplicate?: boolean; updated?: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    
    if (res.status === 409) return { success: false, duplicate: true };
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Unknown server error' }));
      return { success: false, error: errData.error };
    }
    
    const data = await res.json();
    return { success: true, data, updated: res.status === 200 };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message };
  }
}

export function exportToCSV(leads: Lead[]): string {
  const headers = ['Business Name', 'Phone', 'Email', 'WhatsApp', 'Platform', 'Category', 'Score', 'Status', 'Response Status', 'Handled By', 'Date'];
  const rows = leads.map(l => [
    l.business_name, l.phone || '', l.email || '', l.whatsapp || '', l.platform, l.category || '',
    l.score, l.status, l.response_status, l.handled_by || '', l.handled_at || ''
  ]);
  return [headers, ...rows].map(r => r.join(',')).join('\n');
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getActivityHistory(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  } catch (err) {
    console.error('[History Store Error]:', err);
    return [];
  }
}
