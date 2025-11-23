import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'email_stats.db');

// Ensure db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  }
});

export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    let completedTasks = 0;
    let errorOccurred = false;
    let resolved = false;
    const totalTasks = 4; // 4 table creations + 1 index

    // Timeout after 10 seconds to prevent hanging
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('Database initialization timeout - resolving anyway');
        resolve();
      }
    }, 10000);

    const checkComplete = () => {
      completedTasks++;
      if (completedTasks === totalTasks && !errorOccurred && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve();
      }
    };

    const handleError = (err: Error | null, task: string) => {
      if (err && !err.message.includes('already exists')) {
        console.error(`DB initialization error in ${task}:`, err);
        errorOccurred = true;
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(err);
        }
      } else {
        checkComplete();
      }
    };

    db.serialize(() => {
      // Create auth_users table for authentication
      db.run(`
        CREATE TABLE IF NOT EXISTS auth_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => handleError(err, 'auth_users'));

      // Create users table (for email stats data)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          user_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => handleError(err, 'users'));

      // Create daily stats table
      db.run(`
        CREATE TABLE IF NOT EXISTS daily_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          total_emails INTEGER DEFAULT 0,
          emails_sent INTEGER DEFAULT 0,
          emails_received INTEGER DEFAULT 0,
          files_edited INTEGER DEFAULT 0,
          files_viewed INTEGER DEFAULT 0,
          gmail_imap_last_used TEXT,
          gmail_web_last_used TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          UNIQUE(user_id, date)
        )
      `, (err) => handleError(err, 'daily_stats'));

      // Create index for faster queries
      db.run(`CREATE INDEX IF NOT EXISTS idx_date ON daily_stats(date)`, (err) => handleError(err, 'index'));
    });
  });
}

export function getDatabase(): sqlite3.Database {
  return db;
}

export function runQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export function runQuerySingle<T>(sql: string, params: any[] = []): Promise<T | null> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve((row as T) || null);
    });
  });
}

export function executeQuery(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
