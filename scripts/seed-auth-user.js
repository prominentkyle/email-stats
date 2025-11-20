const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../email_stats.db');
const db = new sqlite3.Database(dbPath);

const email = 'admin@example.com';
const password = 'admin123';
const passwordHash = bcrypt.hashSync(password, 10);

db.run(
  `INSERT OR IGNORE INTO auth_users (email, password_hash, name) VALUES (?, ?, ?)`,
  [email, passwordHash, 'Admin User'],
  function(err) {
    if (err) {
      console.error('Error seeding user:', err);
    } else {
      console.log(`✅ Test user created: ${email} / ${password}`);
    }
    db.close();
  }
);
