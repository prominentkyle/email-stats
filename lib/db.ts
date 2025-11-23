import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

let sql: any = null;

// Try to import Vercel Postgres only if the connection string exists
const hasPostgresUrl = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
if (hasPostgresUrl) {
  try {
    const { sql: vercelSql } = require('@vercel/postgres');
    sql = vercelSql;
  } catch (error) {
    console.warn('Vercel Postgres not available, falling back to SQLite');
  }
}

// Use Postgres only if connection string exists AND module loaded successfully
const isVercel = hasPostgresUrl && sql !== null;

let sqliteDb: sqlite3.Database | null = null;

// Initialize SQLite for local development
if (!isVercel) {
  const dbPath = path.join(process.cwd(), 'email_stats.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('SQLite connection error:', err);
    }
  });
}

export function initializeDatabase(): Promise<void> {
  if (isVercel) {
    return initializePostgres();
  } else {
    return initializeSQLite();
  }
}

async function initializePostgres(): Promise<void> {
  try {
    // Create auth_users table
    await sql`
      CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        user_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create daily_stats table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        date TEXT NOT NULL,
        total_emails INTEGER DEFAULT 0,
        emails_sent INTEGER DEFAULT 0,
        emails_received INTEGER DEFAULT 0,
        files_edited INTEGER DEFAULT 0,
        files_viewed INTEGER DEFAULT 0,
        gmail_imap_last_used TEXT,
        gmail_web_last_used TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      )
    `;

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_date ON daily_stats(date)
    `;

    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('PostgreSQL initialization error:', error);
    throw error;
  }
}

function initializeSQLite(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      reject(new Error('SQLite database not initialized'));
      return;
    }

    let completedTasks = 0;
    let errorOccurred = false;
    let resolved = false;
    const totalTasks = 4;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('SQLite initialization timeout - resolving anyway');
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
        console.error(`SQLite initialization error in ${task}:`, err);
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

    sqliteDb!.serialize(() => {
      sqliteDb!.run(
        `
        CREATE TABLE IF NOT EXISTS auth_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => handleError(err, 'auth_users')
      );

      sqliteDb!.run(
        `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          user_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => handleError(err, 'users')
      );

      sqliteDb!.run(
        `
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
      `,
        (err) => handleError(err, 'daily_stats')
      );

      sqliteDb!.run(`CREATE INDEX IF NOT EXISTS idx_date ON daily_stats(date)`, (err) =>
        handleError(err, 'index')
      );
    });
  });
}

export function getDatabase(): sqlite3.Database | null {
  return sqliteDb;
}

export async function runQuery<T>(sql_query: string, params: any[] = []): Promise<T[]> {
  if (isVercel) {
    return runQueryPostgres<T>(sql_query, params);
  } else {
    return runQuerySQLite<T>(sql_query, params);
  }
}

async function runQueryPostgres<T>(sql_query: string, params: any[]): Promise<T[]> {
  try {
    // Build parameterized query for PostgreSQL
    let pgQuery = sql_query;
    let paramIndex = 1;
    while (pgQuery.includes('?')) {
      pgQuery = pgQuery.replace('?', `$${paramIndex}`);
      paramIndex++;
    }

    const result = await sql.query(pgQuery, params);
    return result.rows as T[];
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    throw error;
  }
}

function runQuerySQLite<T>(sql_query: string, params: any[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      reject(new Error('SQLite database not initialized'));
      return;
    }
    sqliteDb.all(sql_query, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows as T[]) || []);
    });
  });
}

export async function runQuerySingle<T>(sql_query: string, params: any[] = []): Promise<T | null> {
  if (isVercel) {
    return runQuerySinglePostgres<T>(sql_query, params);
  } else {
    return runQuerySingleSQLite<T>(sql_query, params);
  }
}

async function runQuerySinglePostgres<T>(sql_query: string, params: any[]): Promise<T | null> {
  try {
    let pgQuery = sql_query;
    let paramIndex = 1;
    while (pgQuery.includes('?')) {
      pgQuery = pgQuery.replace('?', `$${paramIndex}`);
      paramIndex++;
    }

    const result = await sql.query(pgQuery, params);
    return (result.rows[0] as T) || null;
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    throw error;
  }
}

function runQuerySingleSQLite<T>(sql_query: string, params: any[]): Promise<T | null> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      reject(new Error('SQLite database not initialized'));
      return;
    }
    sqliteDb.get(sql_query, params, (err, row) => {
      if (err) reject(err);
      else resolve((row as T) || null);
    });
  });
}

export async function executeQuery(
  sql_query: string,
  params: any[] = []
): Promise<{ lastID: number; changes: number }> {
  if (isVercel) {
    return executeQueryPostgres(sql_query, params);
  } else {
    return executeQuerySQLite(sql_query, params);
  }
}

async function executeQueryPostgres(
  sql_query: string,
  params: any[]
): Promise<{ lastID: number; changes: number }> {
  try {
    let pgQuery = sql_query;
    let paramIndex = 1;
    while (pgQuery.includes('?')) {
      pgQuery = pgQuery.replace('?', `$${paramIndex}`);
      paramIndex++;
    }

    const result = await sql.query(pgQuery, params);
    return { lastID: 0, changes: result.rowCount || 0 };
  } catch (error) {
    console.error('PostgreSQL execute error:', error);
    throw error;
  }
}

function executeQuerySQLite(
  sql_query: string,
  params: any[]
): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    if (!sqliteDb) {
      reject(new Error('SQLite database not initialized'));
      return;
    }
    sqliteDb.run(sql_query, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Helper to convert SQLite syntax to PostgreSQL
function convertSQLiteToPostgres(query: string, params: any[]): string {
  // Replace ? placeholders with $1, $2, etc for PostgreSQL
  let pgQuery = query;
  let paramIndex = 1;
  while (pgQuery.includes('?')) {
    pgQuery = pgQuery.replace('?', `$${paramIndex}`);
    paramIndex++;
  }

  // Replace SQLite-specific syntax
  pgQuery = pgQuery.replace(/AUTOINCREMENT/gi, '');
  pgQuery = pgQuery.replace(/INTEGER PRIMARY KEY/gi, 'SERIAL PRIMARY KEY');
  pgQuery = pgQuery.replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  pgQuery = pgQuery.replace(/UNIQUE\(/gi, 'UNIQUE(');

  return pgQuery;
}
