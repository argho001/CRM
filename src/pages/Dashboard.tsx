import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLeads } from '@/lib/lead-store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, CheckCircle2, XCircle, Target, Loader2 } from 'lucide-react';
import { RESPONSE_STATUS_CONFIG } from '@/types/crm';
import type { Lead } from '@/types/crm';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getLeads();
      setLeads(data);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const done = leads.filter(l => l.status === 'done');
    const cancelled = leads.filter(l => l.status === 'cancelled');
    const total = leads.length;
    const conversionRate = total > 0 ? ((done.length / total) * 100).toFixed(1) : '0';

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayLeads = leads.filter(l => new Date(l.created_at).toDateString() === d.toDateString());
      return { day: dateStr, leads: dayLeads.length };
    });

    const pieData = [
      { name: 'Done', value: done.length, color: 'hsl(142, 76%, 36%)' },
      { name: 'Cancelled', value: cancelled.length, color: 'hsl(0, 84%, 60%)' },
      { name: 'New', value: leads.filter(l => l.status === 'new').length, color: 'hsl(217, 91%, 60%)' },
    ].filter(d => d.value > 0);

    const responseStats = Object.entries(RESPONSE_STATUS_CONFIG).map(([key, config]) => ({
      status: key,
      label: config.label,
      count: done.filter(l => l.response_status === key).length,
    })).filter(s => s.count > 0);

    return { total, done: done.length, cancelled: cancelled.length, conversionRate, last7Days, pieData, responseStats };
  }, [leads]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your lead management operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Leads', value: stats.total, icon: TrendingUp, accent: 'text-primary' },
          { title: 'Done', value: stats.done, icon: CheckCircle2, accent: 'text-success' },
          { title: 'Cancelled', value: stats.cancelled, icon: XCircle, accent: 'text-destructive' },
          { title: 'Conversion', value: `${stats.conversionRate}%`, icon: Target, accent: 'text-warning' },
        ].map(s => (
          <Card key={s.title} className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${s.accent}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.title}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Leads Added (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.last7Days}>
                <XAxis dataKey="day" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 20%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }} />
                <Bar dataKey="leads" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Lead Status Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {stats.pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(217, 33%, 20%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-6 pb-4 flex gap-4 justify-center">
            {stats.pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Response Funnel</CardTitle></CardHeader>
          <CardContent>
            {stats.responseStats.length > 0 ? (
              <div className="space-y-2">
                {stats.responseStats.map(s => (
                  <div key={s.status} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium text-foreground">{s.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No response data yet. Mark leads as Done to start tracking.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
