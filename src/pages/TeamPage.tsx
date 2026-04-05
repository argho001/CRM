import { useState } from 'react';
import { currentUser } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, Plus, UserCheck, UserX } from 'lucide-react';
import type { TeamMember } from '@/types/crm';

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      role: 'member',
      is_active: true,
      leads_handled: 0,
      created_at: new Date().toISOString(),
    };
    setTeam(prev => [...prev, newMember]);
    setAddOpen(false);
    toast.success(`${newMember.name} added to team`);
  };

  const toggleActive = (id: string) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, is_active: !m.is_active } : m));
    toast.success('Member status updated');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Users className="h-6 w-6 text-primary" />Team Management</h1>
          <p className="text-sm text-muted-foreground">{team.filter(m => m.is_active).length} active members</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" />Add Member</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div><Label>Name</Label><Input name="name" required /></div>
              <div><Label>Email</Label><Input name="email" type="email" required /></div>
              <Button type="submit" className="w-full">Add Member</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map(member => (
          <Card key={member.id} className="glass-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <Badge variant={member.is_active ? 'default' : 'secondary'} className="text-[10px]">
                  {member.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground capitalize">{member.role}</span>
                <span className="text-foreground font-medium">{member.leads_handled} leads</span>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => toggleActive(member.id)}>
                {member.is_active ? <><UserX className="h-3 w-3 mr-1" />Deactivate</> : <><UserCheck className="h-3 w-3 mr-1" />Activate</>}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
