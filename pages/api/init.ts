import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase, executeQuery } from '@/lib/db';
import { hashSync } from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initializeDatabase();

    // Create test user
    const email = 'admin@example.com';
    const password = 'admin123';
    const passwordHash = hashSync(password, 10);

    // Use different syntax based on database type
    const isPostgres = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

    const insertQuery = isPostgres
      ? `INSERT INTO auth_users (email, password_hash, name) VALUES (?, ?, ?) ON CONFLICT (email) DO NOTHING`
      : `INSERT OR IGNORE INTO auth_users (email, password_hash, name) VALUES (?, ?, ?)`;

    await executeQuery(insertQuery, [email, passwordHash, 'Admin User']);

    res.status(200).json({
      success: true,
      message: 'Database initialized and test user created',
      credentials: {
        email,
        password,
      },
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({
      error: 'Initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
