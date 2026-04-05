import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, User } from 'lucide-react';

export default function SettingsPage() {
  const [name, setName] = useState('Argho');
  const [email, setEmail] = useState('argho@flashfeed.com');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile updated');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Password changed');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Settings className="h-6 w-6 text-primary" />Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" />Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} type="email" /></div>
            </div>
            <Button type="submit" size="sm">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-sm">Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div><Label>Current Password</Label><Input type="password" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>New Password</Label><Input type="password" /></div>
              <div><Label>Confirm Password</Label><Input type="password" /></div>
            </div>
            <Button type="submit" size="sm" variant="outline">Change Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
