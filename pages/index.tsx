import { useState, useCallback, useEffect, useRef } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import FilterPanel from '@/components/FilterPanel';
import KPICards from '@/components/KPICards';
import SimpleCharts from '@/components/SimpleCharts';
import UserTableRefactored from '@/components/UserTableRefactored';
import UploadModal from '@/components/UploadModal';

export default function Home() {
  const [statsData, setStatsData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [emailFilter, setEmailFilter] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (emailFilter) params.append('email', emailFilter);

      const [statsRes, summaryRes] = await Promise.all([
        fetch(`/api/stats?${params}`),
        fetch(`/api/summary?${params}`),
      ]);

      const stats = await statsRes.json();
      const summary = await summaryRes.json();

      setStatsData(stats.data || []);
      setSummaryData(summary.data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, emailFilter]);

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate, emailFilter, fetchStats]);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    fetchStats();
  };

  return (
    <>
      <Head>
        <title>Email Usage Statistics Dashboard</title>
        <meta name="description" content="Google Workspace Email Usage Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', padding: 'var(--sp-32)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <Header onImportClick={() => setShowUploadModal(true)} />

          {/* Filters */}
          <FilterPanel
            startDate={startDate}
            endDate={endDate}
            emailFilter={emailFilter}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onEmailFilterChange={setEmailFilter}
          />

          {/* KPI Row */}
          {!loading && statsData.length > 0 && (
            <KPICards statsData={statsData} summaryData={summaryData} />
          )}

          {/* Charts */}
          {!loading && statsData.length > 0 && (
            <SimpleCharts statsData={statsData} summaryData={summaryData} />
          )}

          {/* Table */}
          {!loading && statsData.length > 0 && (
            <UserTableRefactored statsData={statsData} />
          )}

          {/* Empty State */}
          {!loading && statsData.length === 0 && (
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: `1px solid var(--border)`,
                borderRadius: 'var(--radius-md)',
                padding: 'var(--sp-64)',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--sp-16)' }}>
                No data available yet
              </p>
              <p>Import a CSV file to get started</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 'var(--sp-64)',
                color: 'var(--text-muted)',
              }}
            >
              Loading data...
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </>
  );
}
