import { useState } from 'react';
import { Lead, PLATFORM_CONFIG, RESPONSE_STATUS_CONFIG } from '@/types/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Phone, Mail, MessageCircle, MapPin, Globe, Star, MapIcon, Facebook, Linkedin, Clock, MessageSquareText, ExternalLink, Calendar, User, Info, Copy, Check, Undo2, PlayCircle, History, MessageSquareQuote, Presentation, Wrench, Beaker, CheckSquare } from 'lucide-react';
import { updateLeadStatus, saveLeadNote } from '@/lib/lead-store';
import { currentUser } from '@/lib/auth';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface LeadCardProps {
  lead: Lead;
  onDone?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRestore?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
  showActions?: boolean;
  showResponseStatus?: boolean;
  onResponseStatusClick?: (lead: Lead) => void;
}

export function LeadCard({ lead, onDone, onCancel, onRestore, onStatusChange, showActions = true, showResponseStatus = false, onResponseStatusClick }: LeadCardProps) {
  const platform = PLATFORM_CONFIG[lead.platform] || { label: lead.platform || 'General' };
  const score = lead.score || 0;
  const scoreColor = score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-destructive';
  
  const status = lead.status || 'new';

  const PlatformIcon = lead.platform === 'google' ? MapIcon : lead.platform === 'facebook' ? Facebook : lead.platform === 'linkedin' ? Linkedin : MapIcon;

  const responseConfig = lead.response_status ? RESPONSE_STATUS_CONFIG[lead.response_status] : null;
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [contactNote, setContactNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const getRedirectUrl = () => {
    if (lead.map_url && lead.map_url.startsWith('http')) return lead.map_url;
    
    const query = encodeURIComponent(`${lead.business_name} ${lead.address || ''}`);
    if (lead.platform === 'google') {
      return `https://maps.google.com/?q=${query}`;
    }
    if (lead.platform === 'facebook') {
      return `https://www.facebook.com/search/top/?q=${encodeURIComponent(lead.business_name)}`;
    }
    if (lead.platform === 'linkedin') {
      return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.business_name)}`;
    }
    return `https://www.google.com/search?q=${query}`;
  };

  const redirectUrl = getRedirectUrl();

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateLeadStatus(lead.id, newStatus as any, currentUser.id);
      onStatusChange?.(lead.id, newStatus);
      toast.success(`Moved lead to ${newStatus}`);
      // If we're on a page that doesn't have a callback, refresh? 
      // But typically onStatusChange will handle removal from list.
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveNote = async () => {
    if (!contactNote.trim()) return;
    setSavingNote(true);
    try {
      await saveLeadNote(lead.id, contactNote, currentUser.id);
      toast.success('Note saved successfully');
      setIsNoteDialogOpen(false);
      setContactNote('');
      // In a real app, ideally we'd update the local state of the lead card too
      // but for now we rely on re-fetch or manual details refresh.
      window.location.reload(); // Quick way to show updated note for now
    } catch (err) {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Card className="glass-card hover:border-primary/30 transition-all duration-200 animate-slide-in group">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate text-sm">{lead.business_name || 'Unnamed Business'}</h3>
            <p className="text-xs text-muted-foreground">{lead.category || 'Lead'}</p>
          </div>
          <span className="text-muted-foreground shrink-0 flex items-center justify-center p-1 bg-muted/50 rounded-md" title={platform.label}>
            <PlatformIcon className="h-4 w-4" />
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {lead.has_website ? (
            <Badge variant="secondary" className="text-[10px] gap-1"><Globe className="h-3 w-3" />HAS WEBSITE</Badge>
          ) : (
            <Badge className="text-[10px] gap-1 bg-destructive/20 text-destructive border-destructive/30"><Globe className="h-3 w-3" />NO WEBSITE</Badge>
          )}
          {showResponseStatus && responseConfig && (
            <Badge
              className={`text-[10px] cursor-pointer ${responseConfig.color}`}
              onClick={() => onResponseStatusClick?.(lead)}
            >
              {responseConfig.label}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-xs text-muted-foreground w-full">
          {lead.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-primary shrink-0" /><span className="truncate">{lead.phone}</span></div>}
          {lead.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-primary shrink-0" /><span className="truncate">{lead.email}</span></div>}
          {lead.whatsapp && <div className="flex items-center gap-1.5"><MessageCircle className="h-3 w-3 text-success shrink-0" /><span className="truncate">{lead.whatsapp}</span></div>}
          {lead.map_url ? (
            <a href={lead.map_url} target="_blank" rel="noopener noreferrer" className="flex flex-start gap-1.5 hover:text-primary transition-colors cursor-pointer text-muted-foreground group/location max-w-full">
              <MapPin className="h-3 w-3 shrink-0 mt-[2px]" />
              <span className="truncate underline decoration-primary/30 decoration-dashed underline-offset-4 group-hover/location:decoration-primary">{lead.address}</span>
            </a>
          ) : (
            <div className="flex flex-start gap-1.5"><MapPin className="h-3 w-3 shrink-0 mt-[2px]" /><span className="truncate">{lead.address}</span></div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            {(lead.rating || 0) > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-warning" />{lead.rating}</span>}
            {(lead.review_count || 0) > 0 && <span className="flex items-center gap-0.5 text-muted-foreground"><MessageSquareText className="h-3 w-3" />{(lead.review_count || 0).toLocaleString()}</span>}
            {lead.last_review_days_ago !== null && lead.last_review_days_ago !== undefined && (
              <span className={`flex items-center gap-0.5 ${lead.last_review_days_ago > 90 ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Clock className="h-3 w-3" />
                {lead.last_review_days_ago === 0 ? 'Today' : `${lead.last_review_days_ago}d ago`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground">{score}</span>
            <div className="score-bar w-12"><div className={`score-fill ${scoreColor}`} style={{ width: `${score}%` }} /></div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 w-full">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full h-8 text-[10px] uppercase font-bold tracking-wider hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Info className="h-3 w-3 mr-1" /> See More Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card border-primary/20">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <PlatformIcon className="h-5 w-5 text-primary" />
                  {lead.business_name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{lead.category}</p>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {/* Contact Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2 flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Contact Details
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase">Phone Number</span>
                      <p className="text-sm font-medium flex items-center gap-2">
                        {lead.phone || 'Not available'}
                        {lead.phone && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => handleCopyPhone(lead.phone)}
                            title="Copy phone number"
                          >
                            {copiedPhone ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase">Email Address</span>
                      <p className="text-sm font-medium flex items-center gap-2">
                        {lead.email || 'Not available'}
                        {lead.email && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(`mailto:${lead.email}`)}><Mail className="h-3 w-3" /></Button>}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase">Website</span>
                      {lead.website_url ? (
                        <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                          {lead.website_url} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">No website found</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes & History */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2 flex items-center gap-2">
                    <History className="h-3 w-3" /> Last Contact Note
                  </h4>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 min-h-[80px]">
                    {lead.last_note ? (
                      <div className="space-y-2">
                        <p className="text-xs italic leading-relaxed text-foreground">"{lead.last_note}"</p>
                        {lead.last_contacted_at && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(lead.last_contacted_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No notes recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Quality & Performance */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2 flex items-center gap-2">
                    <Star className="h-3 w-3" /> Quality Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <span className="text-[10px] text-muted-foreground uppercase">Rating</span>
                      <p className="text-lg font-bold flex items-center gap-1">
                        {lead.rating || '0.0'} <Star className="h-4 w-4 text-warning fill-warning" />
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-[10px] text-primary/70 uppercase font-bold">Lead Score</span>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-black text-primary">{score}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location & Platform - RESTORED */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2 flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Location & Source
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase">Physical Address</span>
                      <p className="text-sm font-medium leading-relaxed">{lead.address}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase">Platform Source</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-fit gap-1.5">
                          <PlatformIcon className="h-3 w-3" /> {platform.label}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-primary hover:bg-primary/10 transition-colors" 
                          onClick={() => window.open(redirectUrl, '_blank')}
                          title={`View on ${platform.label}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & History - RESTORED */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2 flex items-center gap-2">
                    <Clock className="h-3 w-3" /> System Info
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Created At
                      </span>
                      <p className="text-xs font-medium">
                        {new Date(lead.created_at).toLocaleString('en-US', { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })}
                      </p>
                    </div>
                    {lead.handled_by && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                          <User className="h-3 w-3" /> Handled By
                        </span>
                        <p className="text-xs font-medium">{lead.handled_by}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons inside Dialog */}
              <div className="mt-6 pt-6 border-t flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2 flex items-center gap-2">
                  <PlayCircle className="h-3 w-3" /> Quick Actions
                </h4>
                <div className="flex gap-3">
                  {status === 'new' && (
                    <>
                      <Button className="flex-1 bg-success hover:bg-success/90" onClick={() => onDone?.(lead.id)}>Move to Done</Button>
                      <Button variant="destructive" className="flex-1" onClick={() => onCancel?.(lead.id)}>Cancel Lead</Button>
                    </>
                  )}
                  {status === 'done' && (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => handleStatusUpdate('new')}>Undo to Search</Button>
                      <Button className="flex-1 bg-primary" onClick={() => handleStatusUpdate('demo')}>Move to Demo</Button>
                    </>
                  )}
                  {status === 'demo' && (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => handleStatusUpdate('done')}>Undo to Done</Button>
                      <Button className="flex-1 bg-primary" onClick={() => handleStatusUpdate('working')}>Move to Working</Button>
                    </>
                  )}
                  {status === 'working' && (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => handleStatusUpdate('demo')}>Undo to Demo</Button>
                      <Button className="flex-1 bg-primary" onClick={() => handleStatusUpdate('testing')}>Move to Testing</Button>
                    </>
                  )}
                  {status === 'testing' && (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => handleStatusUpdate('working')}>Undo to Working</Button>
                      <Button className="flex-1 bg-success" onClick={() => handleStatusUpdate('completed')}>Complete Project</Button>
                    </>
                  )}
                  {status === 'completed' && (
                    <Button variant="outline" className="w-full" onClick={() => handleStatusUpdate('testing')}>Undo to Testing</Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Contacted Button Section */}
          {['done', 'demo', 'working', 'testing'].includes(status) && (
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full h-8 text-[10px] bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 border-sky-500/20 uppercase font-bold tracking-wider transition-all duration-300">
                  <MessageSquareQuote className="h-3 w-3 mr-1" /> Mark as Contacted
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] glass-card border-sky-500/20">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquareQuote className="h-5 w-5 text-sky-500" />
                    Record Contact Note
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="note" className="text-sm font-semibold">What did the client say?</Label>
                    <Textarea 
                      id="note"
                      placeholder="e.g., Client is interested in a demo next Tuesday at 2 PM..."
                      className="min-h-[120px] bg-background/50 border-sky-500/20 focus:border-sky-500"
                      value={contactNote}
                      onChange={(e) => setContactNote(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground italic">Saving this will automatically record the date and time.</p>
                  </div>
                  <Button 
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold"
                    onClick={handleSaveNote}
                    disabled={savingNote || !contactNote.trim()}
                  >
                    {savingNote ? 'Saving...' : 'Save Contact Note'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {showActions && (
            <div className="flex flex-col gap-2 w-full">
              {/* Context-Aware Action Buttons - Added flex-wrap for responsiveness */}
              <div className="flex flex-wrap gap-2 w-full">
                {status === 'new' && (
                  <>
                    <Button size="sm" className="flex-1 h-8 text-xs bg-success hover:bg-success/80 text-success-foreground" onClick={() => onDone?.(lead.id)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />Done
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs" onClick={() => onCancel?.(lead.id)}>
                      <XCircle className="h-3 w-3 mr-1" />Cancel
                    </Button>
                  </>
                )}

                {status === 'done' && (
                  <>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs px-2" onClick={() => handleStatusUpdate('new')}>
                      <Undo2 className="h-3 w-3 mr-1" />Undo
                    </Button>
                    <Button size="sm" className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-2" onClick={() => handleStatusUpdate('demo')}>
                      <Presentation className="h-3 w-3 mr-1" />Demo
                    </Button>
                  </>
                )}

                {status === 'demo' && (
                  <>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs px-2" onClick={() => handleStatusUpdate('done')}>
                      <Undo2 className="h-3 w-3 mr-1" />Undo
                    </Button>
                    <Button size="sm" className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-2" onClick={() => handleStatusUpdate('working')}>
                      <Wrench className="h-3 w-3 mr-1" />Working
                    </Button>
                  </>
                )}

                {status === 'working' && (
                  <>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs px-2" onClick={() => handleStatusUpdate('demo')}>
                      <Undo2 className="h-3 w-3 mr-1" />Undo
                    </Button>
                    <Button size="sm" className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-2" onClick={() => handleStatusUpdate('testing')}>
                      <Beaker className="h-3 w-3 mr-1" />Testing
                    </Button>
                  </>
                )}

                {status === 'testing' && (
                  <>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs px-2" onClick={() => handleStatusUpdate('working')}>
                      <Undo2 className="h-3 w-3 mr-1" />Undo
                    </Button>
                    <Button size="sm" className="flex-1 h-8 text-xs bg-success hover:bg-success/80 text-success-foreground px-2" onClick={() => handleStatusUpdate('completed')}>
                      <CheckSquare className="h-3 w-3 mr-1" />Done
                    </Button>
                  </>
                )}

                {status === 'completed' && (
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => handleStatusUpdate('testing')}>
                    <Undo2 className="h-3 w-3 mr-1" />Undo to Testing
                  </Button>
                )}

                {status === 'cancelled' && (
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => onRestore?.(lead.id)}>
                    <History className="h-3 w-3 mr-1" /> Restore Lead
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
