import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase, runQuery } from '@/lib/db';

interface SummaryStats {
  date: string;
  total_users: number;
  total_emails: number;
  total_sent: number;
  total_received: number;
  total_files_edited: number;
  total_files_viewed: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initializeDatabase();

    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        ds.date,
        COUNT(DISTINCT ds.user_id) as total_users,
        SUM(ds.total_emails) as total_emails,
        SUM(ds.emails_sent) as total_sent,
        SUM(ds.emails_received) as total_received,
        SUM(ds.files_edited) as total_files_edited,
        SUM(ds.files_viewed) as total_files_viewed
      FROM daily_stats ds
      WHERE 1=1
    `;

    const params: any[] = [];

    if (startDate) {
      query += ' AND ds.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND ds.date <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY ds.date ORDER BY ds.date DESC';

    const summary = await runQuery<SummaryStats>(query, params);

    res.status(200).json({
      success: true,
      data: summary,
      count: summary.length,
    });
  } catch (error) {
    console.error('Summary query error:', error);
    res.status(500).json({
      error: 'Failed to fetch summary',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
