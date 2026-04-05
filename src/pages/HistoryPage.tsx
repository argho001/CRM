import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History } from 'lucide-react';

export default function HistoryPage() {
  const logs: any[] = [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><History className="h-6 w-6 text-primary" />Activity History</h1>
        <p className="text-sm text-muted-foreground">Log of activities and changes</p>
      </div>

      {logs.length > 0 ? (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.searched_by}</TableCell>
                  <TableCell>{log.keyword}</TableCell>
                  <TableCell>{log.location}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(log.searched_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No activity history yet</p>
        </div>
      )}
    </div>
  );
}
