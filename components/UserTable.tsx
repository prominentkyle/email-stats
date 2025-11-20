import { useMemo, useState } from 'react';

interface UserTableProps {
  statsData: any[];
}

export default function UserTable({ statsData }: UserTableProps) {
  const [sortBy, setSortBy] = useState<string>('total_emails');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const aggregatedData = useMemo(() => {
    const userMap = new Map<string, any>();

    statsData.forEach((stat) => {
      const key = stat.email;
      if (!userMap.has(key)) {
        userMap.set(key, {
          email: stat.email,
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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <span className="text-gray-400 ml-1">↕️</span>;
    return sortOrder === 'asc' ? <span className="ml-1">⬆️</span> : <span className="ml-1">⬇️</span>;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 overflow-x-auto">
      <h3 className="text-xl font-bold text-white mb-6">👥 User Statistics</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-purple-300/50">
              <th className="text-left py-3 px-4 text-purple-200 font-semibold cursor-pointer hover:text-white">
                Email
              </th>
              <th
                className="text-right py-3 px-4 text-purple-200 font-semibold cursor-pointer hover:text-white"
                onClick={() => handleSort('total_emails')}
              >
                Total Emails <SortIcon column="total_emails" />
              </th>
              <th
                className="text-right py-3 px-4 text-purple-200 font-semibold cursor-pointer hover:text-white"
                onClick={() => handleSort('emails_sent')}
              >
                Sent <SortIcon column="emails_sent" />
              </th>
              <th
                className="text-right py-3 px-4 text-purple-200 font-semibold cursor-pointer hover:text-white"
                onClick={() => handleSort('emails_received')}
              >
                Received <SortIcon column="emails_received" />
              </th>
              <th
                className="text-right py-3 px-4 text-purple-200 font-semibold cursor-pointer hover:text-white"
                onClick={() => handleSort('files_edited')}
              >
                Files Edited <SortIcon column="files_edited" />
              </th>
              <th
                className="text-right py-3 px-4 text-purple-200 font-semibold cursor-pointer hover:text-white"
                onClick={() => handleSort('files_viewed')}
              >
                Files Viewed <SortIcon column="files_viewed" />
              </th>
              <th className="text-right py-3 px-4 text-purple-200 font-semibold">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {aggregatedData.map((user, index) => (
              <tr
                key={index}
                className="border-b border-purple-300/20 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4 text-white font-medium">{user.email}</td>
                <td className="text-right py-3 px-4 text-blue-200 font-semibold">
                  {user.total_emails.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-green-200">
                  {user.emails_sent.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-purple-200">
                  {user.emails_received.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-orange-200">
                  {user.files_edited.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-pink-200">
                  {user.files_viewed.toLocaleString()}
                </td>
                <td className="text-right py-3 px-4 text-gray-300 text-xs">
                  {new Date(user.lastDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {aggregatedData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-purple-200">No user data available</p>
        </div>
      )}
    </div>
  );
}
