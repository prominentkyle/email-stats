import { Pool, Client } from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Check if we have a Postgres connection string (Neon or any Postgres provider)
const postgresUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
let pool: Pool | null = null;

// Clean up connection string if it has extra quotes or psql prefix
let cleanConnectionString = postgresUrl;
if (cleanConnectionString) {
  // Remove psql prefix if present (e.g., "psql 'postgresql://...")
  cleanConnectionString = cleanConnectionString.replace(/^psql\s+['"]/, '').replace(/['"]$/, '');

  try {
    pool = new Pool({
      connectionString: cleanConnectionString,
      max: 5, // Limit connections for serverless
    });
    console.log('Connected to Postgres');
  } catch (error) {
    console.warn('Failed to connect to Postgres:', error);
    pool = null;
  }
}

const isPostgres = pool !== null;

let sqliteDb: sqlite3.Database | null = null;

// Initialize SQLite for local development (when no Postgres)
if (!isPostgres) {
  const dbPath = path.join(process.cwd(), 'email_stats.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('SQLite connection error:', err);
    } else {
      console.log('Connected to SQLite');
    }
  });
}

export function initializeDatabase(): Promise<void> {
  if (isPostgres) {
    return initializePostgres();
  } else {
    return initializeSQLite();
  }
}

async function initializePostgres(): Promise<void> {
  if (!pool) throw new Error('Postgres pool not initialized');

  const client = await pool.connect();
  try {
    // Create auth_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        user_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create daily_stats table
    await client.query(`
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
    `);

    // Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_date ON daily_stats(date)
    `);

    console.log('PostgreSQL database initialized');
  } finally {
    client.release();
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
    const totalTasks = 4;

    const timeout = setTimeout(() => {
      console.warn('SQLite initialization timeout');
      resolve();
    }, 10000);

    const checkComplete = () => {
      completedTasks++;
      if (completedTasks === totalTasks && !errorOccurred) {
        clearTimeout(timeout);
        resolve();
      }
    };

    const handleError = (err: Error | null, task: string) => {
      if (err && !err.message.includes('already exists')) {
        console.error(`SQLite initialization error in ${task}:`, err);
        errorOccurred = true;
        clearTimeout(timeout);
        reject(err);
      } else {
        checkComplete();
      }
    };

    sqliteDb!.serialize(() => {
      sqliteDb!.run(
        `CREATE TABLE IF NOT EXISTS auth_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => handleError(err, 'auth_users')
      );

      sqliteDb!.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          user_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        (err) => handleError(err, 'users')
      );

      sqliteDb!.run(
        `CREATE TABLE IF NOT EXISTS daily_stats (
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
        )`,
        (err) => handleError(err, 'daily_stats')
      );

      sqliteDb!.run(`CREATE INDEX IF NOT EXISTS idx_date ON daily_stats(date)`, (err) =>
        handleError(err, 'index')
      );
    });
  });
}

export async function runQuery<T>(sql_query: string, params: any[] = []): Promise<T[]> {
  if (isPostgres) {
    return runQueryPostgres<T>(sql_query, params);
  } else {
    return runQuerySQLite<T>(sql_query, params);
  }
}

async function runQueryPostgres<T>(sql_query: string, params: any[]): Promise<T[]> {
  if (!pool) throw new Error('Postgres pool not initialized');

  try {
    // Convert SQLite ? placeholders to Postgres $1, $2, etc
    const pgQuery = convertPlaceholders(sql_query);
    const result = await pool.query(pgQuery, params);
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
  if (isPostgres) {
    return runQuerySinglePostgres<T>(sql_query, params);
  } else {
    return runQuerySingleSQLite<T>(sql_query, params);
  }
}

async function runQuerySinglePostgres<T>(sql_query: string, params: any[]): Promise<T | null> {
  if (!pool) throw new Error('Postgres pool not initialized');

  try {
    const pgQuery = convertPlaceholders(sql_query);
    const result = await pool.query(pgQuery, params);
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
  if (isPostgres) {
    return executeQueryPostgres(sql_query, params);
  } else {
    return executeQuerySQLite(sql_query, params);
  }
}

async function executeQueryPostgres(
  sql_query: string,
  params: any[]
): Promise<{ lastID: number; changes: number }> {
  if (!pool) throw new Error('Postgres pool not initialized');

  try {
    const pgQuery = convertPlaceholders(sql_query);
    const result = await pool.query(pgQuery, params);
    return { lastID: 0, changes: result.rowCount || 0 };
  } catch (error) {
    console.error('PostgreSQL execute error:', error);
    throw error;
  }
}

// Helper function to convert SQLite ? placeholders to Postgres $1, $2, etc
function convertPlaceholders(sql: string): string {
  let paramIndex = 1;
  let result = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];

    // Track if we're inside a string literal
    if ((char === "'" || char === '"') && (i === 0 || sql[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    // Replace ? with $N only if we're not in a string literal
    if (char === '?' && !inString) {
      result += `$${paramIndex}`;
      paramIndex++;
    } else {
      result += char;
    }
  }

  return result;
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
