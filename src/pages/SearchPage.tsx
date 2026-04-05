import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadCard } from '@/components/LeadCard';
import { getNewLeads, markLead, addLead } from '@/lib/lead-store';
import { currentUser } from '@/lib/auth';
import { toast } from 'sonner';
import { Search as SearchIcon, Plus, Upload, Filter, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import type { Lead, Platform } from '@/types/crm';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [platform, setPlatform] = useState<string>('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  
  // CSV Import States
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    refreshLeads();
  }, []);

  const refreshLeads = async () => {
    setLoading(true);
    const data = await getNewLeads();
    setLeads(data);
    setLoading(false);
  };

  const filteredLeads = useMemo(() => {
    return (leads || []).filter(l => {
      if (!l) return false;
      const bname = l.business_name || '';
      const bcat = l.category || '';
      const baddr = l.address || '';
      
      const matchKeyword = !keyword || 
        bname.toLowerCase().includes(keyword.toLowerCase()) || 
        bcat.toLowerCase().includes(keyword.toLowerCase());
        
      const matchLocation = !city || 
        baddr.toLowerCase().includes(city.toLowerCase());
        
      const matchPlatform = platform === 'all' || 
        (l.platform || '').toLowerCase().includes(platform.toLowerCase()) ||
        platform.toLowerCase().includes((l.platform || '').toLowerCase());
        
      return matchKeyword && matchLocation && matchPlatform;
    });
  }, [leads, keyword, city, platform]);

  const handleDone = async (id: string) => {
    await markLead(id, 'done', currentUser.id);
    setLeads(prev => prev.filter(l => l.id !== id));
    toast.success('Lead marked as Done');
  };

  const handleCancel = async (id: string) => {
    await markLead(id, 'cancelled', currentUser.id);
    setLeads(prev => prev.filter(l => l.id !== id));
    toast.success('Lead cancelled');
  };

  const handleAddLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string || '';
    const phone = fd.get('phone') as string || '';
    const websiteUrlStr = fd.get('website_url') as string || '';
    
    const response = await addLead({
      business_name: name,
      phone: phone,
      email: fd.get('email') as string || '',
      whatsapp: fd.get('whatsapp') as string || '',
      address: fd.get('address') as string || '',
      platform: (fd.get('platform') as Platform) || 'google',
      category: fd.get('category') as string || '',
      has_website: websiteUrlStr ? true : false,
      website_url: websiteUrlStr,
      map_url: '',
      followers_count: parseInt(fd.get('followers') as string) || 0,
      rating: parseFloat(fd.get('rating') as string) || 0,
      review_count: 0,
      last_review_days_ago: null,
    });

    if (!response.success) {
      if (response.duplicate) {
        toast.error('A lead with this name or phone number already exists.');
      } else {
        toast.error(`Error: ${response.error || 'Failed to add lead'}`);
      }
      return;
    }

    await refreshLeads();
    setAddOpen(false);
    toast.success('Lead added successfully');
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '').slice(1);
      
      setIsImporting(true);
      setImportProgress(0);
      
      let count = 0;
      let skipped = 0;
      let errors = 0;
      let total = lines.length;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(',');
        if (cols.length >= 1) {
          const website_url = cols[8]?.trim() || '';
          const response = await addLead({
            business_name: cols[0]?.trim() || '',
            phone: cols[1]?.trim() || '',
            email: cols[2]?.trim() || '',
            whatsapp: cols[3]?.trim() || '',
            address: cols[4]?.trim() || '',
            platform: (cols[5]?.trim() as Platform) || 'google',
            category: cols[6]?.trim() || '',
            has_website: website_url ? true : false,
            website_url: website_url,
            map_url: '',
            followers_count: parseInt(cols[9]?.trim()) || 0,
            rating: parseFloat(cols[10]?.trim()) || 0,
            review_count: 0,
            last_review_days_ago: null,
          });
          
          if (response.success) count++;
          else if (response.duplicate) skipped++;
          else {
            console.error('Import Row Error:', response.error);
            errors++;
          }
        }
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      await refreshLeads();
      setIsImporting(false);
      setImportProgress(0);
      
      if (errors > 0) {
        toast.error(`Import finished with ${errors} server errors. Check console.`);
      }

      if (count > 0 || skipped > 0) {
        toast.info(`Import Result: ${count} added, ${skipped} duplicates skipped.`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {isImporting && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-background/80 backdrop-blur-sm p-4 border-b animate-in slide-in-from-top">
          <div className="max-w-2xl mx-auto space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Importing CSV Data...</span>
              <span>{importProgress}%</span>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads Management</h1>
          <p className="text-sm text-muted-foreground">Manage and qualify your business leads</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
            <Button variant="outline" size="sm" asChild><span><Upload className="h-3 w-3 mr-1" />Import CSV</span></Button>
          </label>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3 w-3 mr-1" />Add Lead</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label>Business Name *</Label><Input name="name" required /></div>
                  <div><Label>Phone</Label><Input name="phone" /></div>
                  <div><Label>Email</Label><Input name="email" type="email" /></div>
                  <div><Label>WhatsApp</Label><Input name="whatsapp" /></div>
                  <div><Label>Category</Label><Input name="category" /></div>
                  <div className="col-span-2"><Label>Address</Label><Input name="address" /></div>
                  <div>
                    <Label>Platform</Label>
                    <Select name="platform" defaultValue="google">
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Maps</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Rating</Label><Input name="rating" type="number" step="0.1" min="0" max="5" /></div>
                  <div><Label>Followers</Label><Input name="followers" type="number" /></div>
                  <div className="flex items-center gap-2 pt-5">
                    <Checkbox name="has_website" id="has_website" />
                    <Label htmlFor="has_website">Has Website</Label>
                  </div>
                  <div className="col-span-2"><Label>Website URL</Label><Input name="website_url" /></div>
                </div>
                <Button type="submit" className="w-full">Add Lead</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-muted/30 p-4 rounded-xl border">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filter by name or category..." value={keyword} onChange={e => setKeyword(e.target.value)} className="pl-9" />
        </div>
        <div className="w-full md:w-48">
          <Input placeholder="Filter by city..." value={city} onChange={e => setCity(e.target.value)} />
        </div>
        <div className="w-full md:w-48">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Platform" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="google">Google Maps</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Synchronizing with database...</p>
        </div>
      ) : filteredLeads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onDone={handleDone} onCancel={handleCancel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-2xl">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No leads in your database</p>
          <p className="text-sm">Try importing a CSV or add leads manually</p>
        </div>
      )}
    </div>
  );
}

const Building2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>
);
