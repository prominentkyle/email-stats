'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartsProps {
  statsData: any[];
  summaryData: any[];
}

export default function Charts({ statsData, summaryData }: ChartsProps) {
  // Prepare data for top users chart
  const topUsersData = statsData
    .reduce((acc: any[], stat: any) => {
      const existing = acc.find((u) => u.email === stat.email);
      if (existing) {
        existing.total_emails += stat.total_emails || 0;
        existing.emails_sent += stat.emails_sent || 0;
        existing.emails_received += stat.emails_received || 0;
      } else {
        acc.push({
          email: stat.email.split('@')[0], // Show just the username
          total_emails: stat.total_emails || 0,
          emails_sent: stat.emails_sent || 0,
          emails_received: stat.emails_received || 0,
          fullEmail: stat.email,
        });
      }
      return acc;
    }, [])
    .sort((a: any, b: any) => b.total_emails - a.total_emails)
    .slice(0, 10);

  // Prepare data for sent vs received
  const sentVsReceivedData = topUsersData.slice(0, 8).map((user: any) => ({
    name: user.email,
    Sent: user.emails_sent,
    Received: user.emails_received,
  }));

  // Prepare data for files edited vs viewed
  const filesData = statsData
    .reduce((acc: any[], stat: any) => {
      const existing = acc.find((u) => u.email === stat.email);
      if (existing) {
        existing.files_edited += stat.files_edited || 0;
        existing.files_viewed += stat.files_viewed || 0;
      } else {
        acc.push({
          email: stat.email.split('@')[0],
          files_edited: stat.files_edited || 0,
          files_viewed: stat.files_viewed || 0,
        });
      }
      return acc;
    }, [])
    .sort((a: any, b: any) => (b.files_edited || 0) + (b.files_viewed || 0) - (a.files_edited || 0) - (a.files_viewed || 0))
    .slice(0, 8);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Top Users by Email Activity */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-6">📊 Top 10 Users by Email Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topUsersData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="email" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Bar dataKey="total_emails" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sent vs Received */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-6">📤📥 Sent vs Received</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sentVsReceivedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Legend />
            <Bar dataKey="Sent" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Received" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Activity Trend */}
      {summaryData.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6">📈 Daily Email Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summaryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_emails"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="total_sent"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Files Activity */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-6">📄 Files Edited vs Viewed</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="email" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
              }}
            />
            <Legend />
            <Bar dataKey="files_edited" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="files_viewed" fill="#ec4899" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
