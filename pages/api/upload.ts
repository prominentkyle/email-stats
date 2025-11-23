import type { NextApiRequest, NextApiResponse } from 'next';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { parseCSVFile } from '@/lib/csvParser';
import { initializeDatabase, runQuerySingle, executeQuery, runQuery } from '@/lib/db';
import { existsSync } from 'fs';

const uploadDir = join(process.cwd(), 'uploads');

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

interface DailyStatsRow {
  email: string;
  totalEmails: number;
  emailsSent: number;
  emailsReceived: number;
  filesEdited: number;
  filesViewed: number;
  gmailImapLastUsed: string;
  gmailWebLastUsed: string;
  date: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize database
    await initializeDatabase();

    const { file, filename } = req.body;

    if (!file || !filename) {
      return res.status(400).json({ error: 'File and filename are required' });
    }

    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file to disk
    const filePath = join(uploadDir, filename);
    const buffer = Buffer.from(file, 'base64');
    await writeFile(filePath, buffer);

    // Parse CSV
    const stats = parseCSVFile(filePath);
    console.log(`Upload API - Received ${stats.length} records from ${filename}`);

    if (stats.length === 0) {
      return res.status(400).json({
        error: 'No valid data found in CSV file',
        message: 'The CSV file appears to be empty or improperly formatted',
      });
    }

    // Insert data into database
    let insertedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const stat of stats) {
      if (!stat.email) {
        skippedCount++;
        continue;
      }

      try {
        // Get or create user
        let user = await runQuerySingle<{ id: number }>(
          'SELECT id FROM users WHERE email = ?',
          [stat.email]
        );

        if (!user) {
          const result = await executeQuery(
            'INSERT INTO users (email, user_name) VALUES (?, ?)',
            [stat.email, stat.email.split('@')[0]]
          );
          user = { id: result.lastID };
          console.log(`Created new user: ${stat.email} with ID ${user.id}`);
        }

        // Determine if using Postgres or SQLite
        const isPostgres = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

        // Use different upsert syntax based on database type
        const upsertQuery = isPostgres
          ? `INSERT INTO daily_stats
            (user_id, date, total_emails, emails_sent, emails_received, files_edited, files_viewed, gmail_imap_last_used, gmail_web_last_used)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (user_id, date) DO UPDATE SET
            total_emails = EXCLUDED.total_emails,
            emails_sent = EXCLUDED.emails_sent,
            emails_received = EXCLUDED.emails_received,
            files_edited = EXCLUDED.files_edited,
            files_viewed = EXCLUDED.files_viewed,
            gmail_imap_last_used = EXCLUDED.gmail_imap_last_used,
            gmail_web_last_used = EXCLUDED.gmail_web_last_used`
          : `INSERT OR REPLACE INTO daily_stats
            (user_id, date, total_emails, emails_sent, emails_received, files_edited, files_viewed, gmail_imap_last_used, gmail_web_last_used)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertResult = await executeQuery(upsertQuery, [
          user.id,
          stat.date,
          stat.totalEmails,
          stat.emailsSent,
          stat.emailsReceived,
          stat.filesEdited,
          stat.filesViewed,
          stat.gmailImapLastUsed,
          stat.gmailWebLastUsed,
        ]);
        insertedCount++;
        console.log(`Inserted data for ${stat.email} on ${stat.date}: ${stat.totalEmails} emails`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error inserting data for ${stat.email}:`, errorMsg);
        errors.push(`${stat.email}: ${errorMsg}`);
        skippedCount++;
      }
    }

    console.log(`Upload complete - Inserted: ${insertedCount}, Skipped: ${skippedCount}`);

    res.status(200).json({
      success: true,
      message: 'CSV uploaded and processed successfully',
      insertedCount,
      skippedCount,
      totalRecords: stats.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process CSV file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
