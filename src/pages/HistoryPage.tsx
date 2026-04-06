import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, ArrowRight, User, Calendar, Loader2, MessageSquare } from 'lucide-react';
import { getActivityHistory } from '@/lib/lead-store';
import { Badge } from '@/components/ui/badge';

const STATUS_LABELS: Record<string, string> = {
  new: 'Search',
  done: 'Done',
  demo: 'Demo',
  working: 'Working',
  testing: 'Testing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  // Response statuses
  not_contacted: 'Not Contacted',
  no_response: 'No Response',
  replied: 'Replied',
  interested: 'Interested',
  follow_up: 'Follow Up',
  proposal_sent: 'Proposal Sent',
  converted: 'Converted',
};

export default function HistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const data = await getActivityHistory();
    setLogs(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Activity History
          </h1>
          <p className="text-sm text-muted-foreground">Real-time log of lead transitions and updates</p>
        </div>
        <button 
          onClick={fetchHistory} 
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />} Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading activity logs...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden border border-primary/10">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px]">Business Name</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead className="text-right">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-foreground">
                    {log.lead?.business_name || 'Unknown Lead'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-normal">
                        {STATUS_LABELS[log.old_status] || log.old_status}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge className="text-[10px] uppercase bg-primary/10 text-primary border-primary/20">
                        {STATUS_LABELS[log.new_status] || log.new_status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {log.user?.name || log.updated_by || 'System'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(log.updated_at).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {log.note ? (
                      <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground italic">
                        <MessageSquare className="h-3 w-3" /> {log.note}
                      </div>
                    ) : (
                      <span className="text-muted-foreground opacity-30">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-24 text-muted-foreground border-2 border-dashed rounded-3xl">
          <History className="h-16 w-16 mx-auto mb-6 opacity-10" />
          <p className="text-xl font-medium">No activity history yet</p>
          <p className="text-sm">Status changes will appear here as your team works.</p>
        </div>
      )}
    </div>
  );
}
