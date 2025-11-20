import { useMemo, useState } from 'react';

interface UserTableRefactoredProps {
  statsData: any[];
}

export default function UserTableRefactored({ statsData }: UserTableRefactoredProps) {
  const [sortBy, setSortBy] = useState<string>('total_emails');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const aggregatedData = useMemo(() => {
    const userMap = new Map<string, any>();

    statsData.forEach((stat) => {
      const key = stat.email;
      if (!userMap.has(key)) {
        userMap.set(key, {
          email: stat.email,
          name: stat.email.split('@')[0],
          total_emails: stat.total_emails || 0,
          emails_sent: stat.emails_sent || 0,
          emails_received: stat.emails_received || 0,
          files_edited: stat.files_edited || 0,
          files_viewed: stat.files_viewed || 0,
          lastDate: stat.date,
        });
      } else {
        const existing = userMap.get(key);
        existing.total_emails += stat.total_emails || 0;
        existing.emails_sent += stat.emails_sent || 0;
        existing.emails_received += stat.emails_received || 0;
        existing.files_edited += stat.files_edited || 0;
        existing.files_viewed += stat.files_viewed || 0;
        if (stat.date > existing.lastDate) {
          existing.lastDate = stat.date;
        }
      }
    });

    return Array.from(userMap.values())
      .sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        const result = aVal - bVal;
        return sortOrder === 'desc' ? -result : result;
      });
  }, [statsData, sortBy, sortOrder]);

  const toggleExpand = (email: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const tableHeaderStyle: React.CSSProperties = {
    backgroundColor: 'var(--card)',
    borderBottom: `2px solid var(--border)`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const thStyle: React.CSSProperties = {
    padding: 'var(--sp-12) var(--sp-16)',
    textAlign: 'left',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: 'var(--sp-12) var(--sp-16)',
    borderBottom: `1px solid var(--border)`,
    fontSize: 'var(--text-sm)',
    color: 'var(--text)',
  };

  const rowHoverStyle: React.CSSProperties = {
    backgroundColor: 'var(--accent-light)',
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--text-sm)',
          }}
        >
          <thead style={tableHeaderStyle}>
            <tr>
              <th style={{ ...thStyle, width: '50px' }}></th>
              <th style={{ ...thStyle, minWidth: '200px' }}>Email</th>
              <th
                style={{ ...thStyle, textAlign: 'right', minWidth: '120px' }}
                onClick={() => handleSort('total_emails')}
              >
                Total {sortBy === 'total_emails' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th
                style={{ ...thStyle, textAlign: 'right', minWidth: '100px' }}
                onClick={() => handleSort('emails_sent')}
              >
                Sent {sortBy === 'emails_sent' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th
                style={{ ...thStyle, textAlign: 'right', minWidth: '100px' }}
                onClick={() => handleSort('emails_received')}
              >
                Received {sortBy === 'emails_received' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
            </tr>
          </thead>
          <tbody>
            {aggregatedData.map((user, idx) => (
              <tr
                key={idx}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                style={{
                  transition: 'background-color 200ms ease',
                }}
              >
                <td style={{ ...tdStyle, textAlign: 'center', width: '50px' }}>
                  <button
                    onClick={() => toggleExpand(user.email)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: 0,
                      width: '30px',
                      height: '30px',
                    }}
                  >
                    {expandedRows.has(user.email) ? '▼' : '▶'}
                  </button>
                </td>
                <td
                  style={{
                    ...tdStyle,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    minWidth: '180px',
                  }}
                >
                  {user.email}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', minWidth: '120px' }}>
                  <strong>{user.total_emails.toLocaleString()}</strong>
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', minWidth: '100px' }}>
                  {user.emails_sent.toLocaleString()}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', minWidth: '100px' }}>
                  {user.emails_received.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {aggregatedData.length === 0 && (
        <div
          style={{
            padding: 'var(--sp-48)',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <p>No user data available</p>
        </div>
      )}
    </div>
  );
}
