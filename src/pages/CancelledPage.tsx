import { useState, useMemo, useEffect } from 'react';
import { LeadCard } from '@/components/LeadCard';
import { getLeadsByStatus, restoreLead, exportToCSV, downloadCSV } from '@/lib/lead-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, XCircle, Loader2 } from 'lucide-react';
import { Lead } from '@/types/crm';

export default function CancelledPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    refreshLeads();
  }, []);

  const refreshLeads = async () => {
    setLoading(true);
    const data = await getLeadsByStatus('cancelled');
    setLeads(data);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return (leads || []).filter(l => {
      if (!l) return false;
      const bname = l.business_name || '';
      return !search || bname.toLowerCase().includes(search.toLowerCase());
    });
  }, [leads, search]);

  const handleRestore = async (id: string) => {
    await restoreLead(id);
    await refreshLeads();
    toast.success('Lead restored');
  };

  const handleExport = () => {
    const csv = exportToCSV(filtered);
    downloadCSV(csv, 'cancelled-leads.csv');
    toast.success('Exported to CSV');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><XCircle className="h-6 w-6 text-destructive" />Cancelled Leads</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} cancelled leads</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-3 w-3 mr-1" />Export CSV</Button>
      </div>

      <Input placeholder="Search business name..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Synchronizing with database...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(lead => (
            <LeadCard key={lead.id} lead={lead} showActions onRestore={handleRestore} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <XCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No cancelled leads</p>
        </div>
      )}
    </div>
  );
}
