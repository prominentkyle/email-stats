const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../email_stats.db');
const db = new sqlite3.Database(dbPath);

const users = [
  {
    email: 'kyle@cabletiesunlimited.com',
    password: 'admin123!@#',
    name: 'Kyle'
  },
  {
    email: 'scott@cabletiesunlimited.com',
    password: 'admin123!@#',
    name: 'Scott'
  }
];

let completed = 0;

users.forEach((user) => {
  const passwordHash = bcrypt.hashSync(user.password, 10);

  db.run(
    `INSERT OR IGNORE INTO auth_users (email, password_hash, name) VALUES (?, ?, ?)`,
    [user.email, passwordHash, user.name],
    function(err) {
      if (err) {
        console.error(`Error creating user ${user.email}:`, err);
      } else {
        console.log(`✅ Created user: ${user.email}`);
      }

      completed++;
      if (completed === users.length) {
        db.close();
      }
    }
  );
});
