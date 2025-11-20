import { useMemo } from 'react';

interface KPICardsProps {
  statsData: any[];
  summaryData: any[];
}

export default function KPICards({ statsData, summaryData }: KPICardsProps) {
  const metrics = useMemo(() => {
    if (!statsData.length) {
      return [];
    }

    const userMap = new Map<string, any>();
    statsData.forEach((stat) => {
      const key = stat.email;
      if (!userMap.has(key)) {
        userMap.set(key, {
          total_emails: stat.total_emails || 0,
          emails_sent: stat.emails_sent || 0,
          emails_received: stat.emails_received || 0,
          files_edited: stat.files_edited || 0,
          files_viewed: stat.files_viewed || 0,
        });
      } else {
        const existing = userMap.get(key);
        existing.total_emails += stat.total_emails || 0;
        existing.emails_sent += stat.emails_sent || 0;
        existing.emails_received += stat.emails_received || 0;
        existing.files_edited += stat.files_edited || 0;
        existing.files_viewed += stat.files_viewed || 0;
      }
    });

    const totals = Array.from(userMap.values()).reduce(
      (acc, user) => ({
        total_emails: acc.total_emails + (user.total_emails || 0),
        emails_sent: acc.emails_sent + (user.emails_sent || 0),
        emails_received: acc.emails_received + (user.emails_received || 0),
        files_edited: acc.files_edited + (user.files_edited || 0),
        files_viewed: acc.files_viewed + (user.files_viewed || 0),
      }),
      {
        total_emails: 0,
        emails_sent: 0,
        emails_received: 0,
        files_edited: 0,
        files_viewed: 0,
      }
    );

    // Calculate deltas (compare to average daily)
    const avgDaily = summaryData.length > 0 ? summaryData[0] : null;
    const deltaPercent = (current: number, avg: number | undefined) => {
      if (!avg || avg === 0) return 0;
      return Math.round(((current - avg) / avg) * 100);
    };

    return [
      {
        label: 'Total Emails',
        value: totals.total_emails,
        delta: deltaPercent(
          totals.total_emails,
          avgDaily?.total_emails
        ),
        icon: '📧',
      },
      {
        label: 'Emails Sent',
        value: totals.emails_sent,
        delta: deltaPercent(totals.emails_sent, avgDaily?.total_sent),
        icon: '📤',
      },
      {
        label: 'Emails Received',
        value: totals.emails_received,
        delta: deltaPercent(totals.emails_received, avgDaily?.total_received),
        icon: '📥',
      },
      {
        label: 'Active Users',
        value: userMap.size,
        delta: 0,
        icon: '👥',
      },
    ];
  }, [statsData, summaryData]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--card)',
    border: `1px solid var(--border)`,
    borderRadius: 'var(--radius-md)',
    padding: 'var(--sp-16)',
    boxShadow: 'var(--shadow-xs)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '140px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 'var(--sp-8)',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--sp-8)',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 'var(--text-2xl)',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 'var(--sp-8)',
  };

  const deltaStyle = (delta: number): React.CSSProperties => ({
    fontSize: 'var(--text-sm)',
    color: delta > 0 ? 'var(--status-positive)' : delta < 0 ? 'var(--status-negative)' : 'var(--text-muted)',
    fontWeight: 500,
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--sp-16)',
        marginBottom: 'var(--sp-32)',
      }}
    >
      {metrics.map((metric, idx) => (
        <div key={idx} style={cardStyle}>
          <div>
            <div style={labelStyle}>
              <span>{metric.icon}</span>
              {metric.label}
            </div>
            <div style={valueStyle}>{metric.value.toLocaleString()}</div>
          </div>
          {metric.delta !== 0 && (
            <div style={deltaStyle(metric.delta)}>
              {metric.delta > 0 ? '↑' : '↓'} {Math.abs(metric.delta)}% vs avg
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
