import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase, runQuery } from '@/lib/db';

interface UserStats {
  id: number;
  email: string;
  user_name: string;
  total_emails: number;
  emails_sent: number;
  emails_received: number;
  files_edited: number;
  files_viewed: number;
  date: string;
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

    const { startDate, endDate, email } = req.query;

    let query = `
      SELECT
        u.id,
        u.email,
        u.user_name,
        ds.date,
        ds.total_emails,
        ds.emails_sent,
        ds.emails_received,
        ds.files_edited,
        ds.files_viewed
      FROM daily_stats ds
      JOIN users u ON ds.user_id = u.id
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

    if (email) {
      query += ' AND u.email LIKE ?';
      params.push(`%${email}%`);
    }

    query += ' ORDER BY ds.date DESC, u.email ASC';

    const stats = await runQuery<UserStats>(query, params);

    res.status(200).json({
      success: true,
      data: stats,
      count: stats.length,
    });
  } catch (error) {
    console.error('Stats query error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
