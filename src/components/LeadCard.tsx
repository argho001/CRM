import { Lead, PLATFORM_CONFIG, RESPONSE_STATUS_CONFIG } from '@/types/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Phone, Mail, MessageCircle, MapPin, Globe, Star, MapIcon, Facebook, Linkedin, Clock, MessageSquareText } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onDone?: (id: string) => void;
  onCancel?: (id: string) => void;
  onRestore?: (id: string) => void;
  showActions?: boolean;
  showResponseStatus?: boolean;
  onResponseStatusClick?: (lead: Lead) => void;
}

export function LeadCard({ lead, onDone, onCancel, onRestore, showActions = true, showResponseStatus = false, onResponseStatusClick }: LeadCardProps) {
  const platform = PLATFORM_CONFIG[lead.platform] || { label: lead.platform || 'General' };
  const score = lead.score || 0;
  const scoreColor = score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-destructive';

  const PlatformIcon = lead.platform === 'google' ? MapIcon : lead.platform === 'facebook' ? Facebook : lead.platform === 'linkedin' ? Linkedin : MapIcon;

  const responseConfig = lead.response_status ? RESPONSE_STATUS_CONFIG[lead.response_status] : null;

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

        {showActions && (
          <div className="flex gap-2 pt-1">
            {onDone && (
              <Button size="sm" className="flex-1 h-8 text-xs bg-success hover:bg-success/80 text-success-foreground" onClick={() => onDone(lead.id)}>
                <CheckCircle2 className="h-3 w-3 mr-1" />Done
              </Button>
            )}
            {onCancel && (
              <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs" onClick={() => onCancel(lead.id)}>
                <XCircle className="h-3 w-3 mr-1" />Cancel
              </Button>
            )}
            {onRestore && (
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => onRestore(lead.id)}>
                Restore
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
