import { useMemo } from 'react';
import SummaryCards from './SummaryCards';
import UserTable from './UserTable';
import Charts from './Charts';

interface DashboardProps {
  statsData: any[];
  summaryData: any[];
  loading: boolean;
}

export default function Dashboard({
  statsData,
  summaryData,
  loading,
}: DashboardProps) {
  const aggregatedStats = useMemo(() => {
    if (!statsData.length) {
      return {
        totalEmails: 0,
        totalSent: 0,
        totalReceived: 0,
        filesEdited: 0,
        filesViewed: 0,
        uniqueUsers: 0,
        avgEmailsPerUser: 0,
      };
    }

    const userMap = new Map<string, any>();

    statsData.forEach((stat) => {
      const key = stat.email;
      if (!userMap.has(key)) {
        userMap.set(key, {
          ...stat,
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

    const totalEmails = Array.from(userMap.values()).reduce(
      (sum, user) => sum + (user.total_emails || 0),
      0
    );
    const totalSent = Array.from(userMap.values()).reduce(
      (sum, user) => sum + (user.emails_sent || 0),
      0
    );
    const totalReceived = Array.from(userMap.values()).reduce(
      (sum, user) => sum + (user.emails_received || 0),
      0
    );
    const filesEdited = Array.from(userMap.values()).reduce(
      (sum, user) => sum + (user.files_edited || 0),
      0
    );
    const filesViewed = Array.from(userMap.values()).reduce(
      (sum, user) => sum + (user.files_viewed || 0),
      0
    );
    const uniqueUsers = userMap.size;

    return {
      totalEmails,
      totalSent,
      totalReceived,
      filesEdited,
      filesViewed,
      uniqueUsers,
      avgEmailsPerUser: uniqueUsers > 0 ? Math.round(totalEmails / uniqueUsers) : 0,
    };
  }, [statsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!statsData.length) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 text-center border border-white/20">
        <p className="text-purple-200 text-lg">
          No data available. Upload a CSV file to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <SummaryCards stats={aggregatedStats} />

      {/* Charts */}
      <Charts statsData={statsData} summaryData={summaryData} />

      {/* User Table */}
      <UserTable statsData={statsData} />
    </div>
  );
}
