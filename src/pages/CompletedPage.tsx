import { useState, useMemo, useEffect } from 'react';
import { LeadCard } from '@/components/LeadCard';
import { getLeadsByStatus, updateResponseStatus, exportToCSV, downloadCSV } from '@/lib/lead-store';
import { currentUser } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Download, CheckSquare, Loader2 } from 'lucide-react';
import { Lead, ResponseStatus, RESPONSE_STATUS_CONFIG } from '@/types/crm';

export default function CompletedPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [responseFilter, setResponseFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState<ResponseStatus>('converted');
  const [note, setNote] = useState('');

  useEffect(() => {
    refreshLeads();
  }, []);

  const refreshLeads = async () => {
    setLoading(true);
    const data = await getLeadsByStatus('completed');
    setLeads(data);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return (leads || []).filter(l => {
      if (!l) return false;
      const bname = l.business_name || '';
      const matchSearch = !search || bname.toLowerCase().includes(search.toLowerCase());
      
      const matchPlatform = platformFilter === 'all' || 
        (l.platform || '').toLowerCase().includes(platformFilter.toLowerCase()) ||
        platformFilter.toLowerCase().includes((l.platform || '').toLowerCase());
        
      const matchResponse = responseFilter === 'all' || l.response_status === responseFilter;
      return matchSearch && matchPlatform && matchResponse;
    });
  }, [leads, search, platformFilter, responseFilter]);

  const handleResponseUpdate = async () => {
    if (!selectedLead) return;
    await updateResponseStatus(selectedLead.id, newStatus, currentUser.id, note);
    await refreshLeads();
    setSelectedLead(null);
    setNote('');
    toast.success('Response status updated');
  };

  const handleExport = () => {
    const csv = exportToCSV(filtered);
    downloadCSV(csv, 'completed-leads.csv');
    toast.success('Exported to CSV');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><CheckSquare className="h-6 w-6 text-success" />Completed</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} successfully closed leads</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-3 w-3 mr-1" />Export CSV</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search business name..." value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-[200px]" />
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="sm:max-w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="google">Google Maps</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
          </SelectContent>
        </Select>
        <Select value={responseFilter} onValueChange={setResponseFilter}>
          <SelectTrigger className="sm:max-w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(RESPONSE_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Fetching leads...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(lead => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              showResponseStatus 
              onResponseStatusClick={(l) => { setSelectedLead(l); setNewStatus(l.response_status); }} 
              onStatusChange={refreshLeads}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-2xl">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No leads in Completed section</p>
          <p className="text-sm">Finalize leads from the Testing stage</p>
        </div>
      )}

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Response — {selectedLead?.business_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Response Status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ResponseStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RESPONSE_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Project finished successfully" />
            </div>
            <Button onClick={handleResponseUpdate} className="w-full">Update Status</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
