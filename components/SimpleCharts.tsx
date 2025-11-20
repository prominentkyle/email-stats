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
} from 'recharts';

interface SimpleChartsProps {
  statsData: any[];
  summaryData: any[];
}

const chartColors = {
  grid: '#E4E8F0',
  text: '#6C757D',
  accent: '#4F46E5',
  secondary: '#10B981',
  tertiary: '#F59E0B',
};

const CustomTooltip = (props: any) => {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--sp-12)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {payload.map((entry: any, idx: number) => (
        <div key={idx} style={{ color: entry.color, fontSize: 'var(--text-sm)' }}>
          {entry.name}: <strong>{entry.value.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
};

export default function SimpleCharts({ statsData, summaryData }: SimpleChartsProps) {
  // Top users data - aggregated across all selected data
  const topUsersData = statsData
    .reduce((acc: any[], stat: any) => {
      const existing = acc.find((u) => u.email === stat.email);
      if (existing) {
        existing.total_emails += stat.total_emails || 0;
      } else {
        acc.push({
          email: stat.email,
          name: stat.email.split('@')[0],
          total_emails: stat.total_emails || 0,
        });
      }
      return acc;
    }, [])
    .sort((a: any, b: any) => b.total_emails - a.total_emails)
    .slice(0, 18)
    .map((u: any) => ({
      name: u.name,
      total_emails: u.total_emails,
    }));

  // Sent vs received - aggregated by user across selected dates
  const sentVsReceivedData = statsData
    .reduce((acc: any[], stat: any) => {
      const existing = acc.find((u) => u.email === stat.email);
      if (existing) {
        existing.Sent += stat.emails_sent || 0;
        existing.Received += stat.emails_received || 0;
      } else {
        acc.push({
          email: stat.email,
          name: stat.email.split('@')[0],
          Sent: stat.emails_sent || 0,
          Received: stat.emails_received || 0,
        });
      }
      return acc;
    }, [])
    .sort((a: any, b: any) => (b.Sent + b.Received) - (a.Sent + a.Received))
    .slice(0, 8)
    .map((u: any) => ({
      name: u.name,
      Sent: u.Sent,
      Received: u.Received,
    }));

  // Sort summary data by date (oldest first)
  const sortedSummaryData = [...summaryData].sort((a: any, b: any) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--sp-24)',
        marginBottom: 'var(--sp-32)',
      }}
    >
      {/* Daily Trend - Primary Chart */}
      {sortedSummaryData.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: `1px solid var(--border)`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--sp-24)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              marginBottom: 'var(--sp-16)',
              color: 'var(--text)',
            }}
          >
            📈 Daily Email Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sortedSummaryData}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: chartColors.text, fontSize: 12 }}
                axisLine={{ stroke: chartColors.grid }}
              />
              <YAxis
                tick={{ fill: chartColors.text, fontSize: 12 }}
                axisLine={{ stroke: chartColors.grid }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="total_emails"
                stroke={chartColors.accent}
                strokeWidth={2}
                dot={false}
                name="Total Emails"
              />
              <Line
                type="monotone"
                dataKey="total_sent"
                stroke={chartColors.secondary}
                strokeWidth={2}
                dot={false}
                name="Sent"
              />
              <Line
                type="monotone"
                dataKey="total_received"
                stroke={chartColors.tertiary}
                strokeWidth={2}
                dot={false}
                name="Received"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparatives Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 'var(--sp-24)',
        }}
      >
        {/* Top Users */}
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: `1px solid var(--border)`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--sp-24)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              marginBottom: 'var(--sp-16)',
              color: 'var(--text)',
            }}
          >
            👥 Top Users
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-12)' }}>
            {topUsersData.map((user: any, idx: number) => {
              const maxValue = Math.max(...topUsersData.map((u: any) => u.total_emails));
              const percentage = (user.total_emails / maxValue) * 100;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-12)' }}>
                  <div style={{ minWidth: '80px', textAlign: 'right', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    {user.name}
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '32px', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: chartColors.accent,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: 'var(--sp-12)',
                        transition: 'width 200ms ease',
                      }}
                    >
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'white' }}>
                        {user.total_emails.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sent vs Received */}
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: `1px solid var(--border)`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--sp-24)',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              marginBottom: 'var(--sp-16)',
              color: 'var(--text)',
            }}
          >
            📤📥 Sent vs Received
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-12)' }}>
            {sentVsReceivedData.map((user: any, idx: number) => {
              const maxValue = Math.max(
                ...sentVsReceivedData.map((u: any) => Math.max(u.Sent, u.Received))
              );
              const sentPercentage = (user.Sent / maxValue) * 100;
              const receivedPercentage = (user.Received / maxValue) * 100;
              return (
                <div key={idx}>
                  <div style={{ minWidth: '80px', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--sp-8)' }}>
                    {user.name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
                    {/* Sent Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-8)' }}>
                      <div style={{ minWidth: '50px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Sent</div>
                      <div style={{ flex: 1, position: 'relative', height: '24px', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', overflow: 'visible' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${sentPercentage}%`,
                            backgroundColor: chartColors.accent,
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: 'var(--sp-8)',
                            minWidth: '60px',
                            transition: 'width 200ms ease',
                          }}
                        >
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'white', whiteSpace: 'nowrap' }}>
                            {user.Sent.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Received Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-8)' }}>
                      <div style={{ minWidth: '50px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Received</div>
                      <div style={{ flex: 1, position: 'relative', height: '24px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', overflow: 'visible' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${receivedPercentage}%`,
                            backgroundColor: chartColors.secondary,
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: 'var(--sp-8)',
                            minWidth: '60px',
                            transition: 'width 200ms ease',
                          }}
                        >
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'white', whiteSpace: 'nowrap' }}>
                            {user.Received.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
