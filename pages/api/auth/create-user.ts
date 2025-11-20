import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase, executeQuery } from '@/lib/db';
import { hashSync } from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    await initializeDatabase();

    const passwordHash = hashSync(password, 10);
    const name = email.split('@')[0];

    await executeQuery(
      `INSERT OR IGNORE INTO auth_users (email, password_hash, name) VALUES (?, ?, ?)`,
      [email, passwordHash, name]
    );

    res.status(200).json({
      success: true,
      message: `User ${email} created successfully`,
      email,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
