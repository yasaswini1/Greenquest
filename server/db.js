const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

const dbFile = path.join(__dirname, 'localdb.sqlite');

// Ensure server directory exists
if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

const db = new Database(dbFile);
db.pragma('journal_mode = WAL');

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      co2_saved REAL NOT NULL DEFAULT 0,
      avatar_url TEXT,
      last_login_date TEXT,
      current_streak INTEGER NOT NULL DEFAULT 0,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      points INTEGER NOT NULL,
      co2_saved REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'verified',
      ai_score REAL,
      image_path TEXT,
      event_time TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      client_ai_label TEXT,
      client_ai_score REAL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      description TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      category TEXT NOT NULL,
      current_points INTEGER NOT NULL,
      ai_score REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_id TEXT,
      admin_notes TEXT,
      new_points INTEGER,
      resolved_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_evidence (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      image_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      target_value REAL NOT NULL,
      target_unit TEXT NOT NULL,
      bonus_points INTEGER NOT NULL,
      challenge_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenge_completions (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      activity_id TEXT,
      evidence_value REAL,
      evidence_unit TEXT,
      bonus_points_earned INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (activity_id) REFERENCES activities(id)
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      points INTEGER NOT NULL,
      category TEXT NOT NULL,
      available INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reward_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      redemption_code TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reward_id) REFERENCES rewards(id)
    );
  `);
};

const ensureColumn = (table, column, type) => {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = info.some((col) => col.name === column);
  if (!exists) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  }
};

const seedDatabase = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  const usersToSeed = [
    {
      name: 'Sarah Green',
      email: 'sarah@example.com',
      password: 'password123',
      points: 4523,
      co2_saved: 145.3,
      avatar_url: null,
    },
    {
      name: 'Alex Rivera',
      email: 'alex@example.com',
      password: 'password123',
      points: 3120,
      co2_saved: 98.5,
      avatar_url: null,
    },
  ];

  const activitiesToSeed = [
    {
      userEmail: 'sarah@example.com',
      type: 'Public Transport',
      category: 'Transport',
      description: 'Used metro instead of driving',
      points: 25,
      co2_saved: 2.5,
      status: 'verified',
      ai_score: 97,
    },
    {
      userEmail: 'sarah@example.com',
      type: 'Plastic-Free Shopping',
      category: 'Waste',
      description: 'Bought groceries with reusable containers',
      points: 30,
      co2_saved: 0.9,
      status: 'verified',
      ai_score: 95,
    },
    {
      userEmail: 'alex@example.com',
      type: 'Cycling to Work',
      category: 'Transport',
      description: 'Biked 8km to office',
      points: 35,
      co2_saved: 4.0,
      status: 'verified',
      ai_score: 96,
    },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, points, co2_saved, avatar_url, created_at)
    VALUES (@id, @name, @email, @password_hash, @points, @co2_saved, @avatar_url, @created_at)
  `);

  const getUserByEmail = db.prepare(`SELECT * FROM users WHERE email = ?`);

  const insertActivity = db.prepare(`
    INSERT INTO activities (id, user_id, type, category, description, points, co2_saved, status, ai_score, created_at)
    VALUES (@id, @user_id, @type, @category, @description, @points, @co2_saved, @status, @ai_score, @created_at)
  `);

  if (userCount === 0) {
    usersToSeed.forEach((user) => {
      const id = nanoid();
      insertUser.run({
        id,
        name: user.name,
        email: user.email,
        password_hash: bcrypt.hashSync(user.password, 10),
        points: user.points,
        co2_saved: user.co2_saved,
        avatar_url: user.avatar_url,
        created_at: new Date().toISOString(),
      });
    });

    activitiesToSeed.forEach((activity) => {
      const user = getUserByEmail.get(activity.userEmail);
      if (!user) return;
      insertActivity.run({
        id: nanoid(),
        user_id: user.id,
        type: activity.type,
        category: activity.category,
        description: activity.description,
        points: activity.points,
        co2_saved: activity.co2_saved,
        status: activity.status,
        ai_score: activity.ai_score,
        created_at: new Date().toISOString(),
      });
    });
  }
};

createTables();
ensureColumn('activities', 'event_time', 'TEXT');
ensureColumn('activities', 'location', 'TEXT');
ensureColumn('activities', 'latitude', 'REAL');
ensureColumn('activities', 'longitude', 'REAL');
ensureColumn('activities', 'geo_accuracy', 'REAL');
ensureColumn('activities', 'visibility', 'TEXT');
ensureColumn('users', 'last_login_date', 'TEXT');
ensureColumn('users', 'current_streak', 'INTEGER');
ensureColumn('users', 'is_admin', 'INTEGER');

// Seed daily challenges
const seedChallenges = () => {
  const today = new Date().toISOString().split('T')[0];
  const existingChallenge = db.prepare('SELECT * FROM daily_challenges WHERE challenge_date = ?').get(today);
  
  if (!existingChallenge) {
    const challenges = [
      {
        title: 'Cycle 5km',
        description: 'Complete a 5km bicycle ride today',
        category: 'transport',
        target_value: 5,
        target_unit: 'km',
        bonus_points: 50,
        challenge_date: today,
      },
      {
        title: 'Plant 4 Trees',
        description: 'Plant 4 trees or saplings today',
        category: 'tree',
        target_value: 4,
        target_unit: 'trees',
        bonus_points: 100,
        challenge_date: today,
      },
      {
        title: 'Plastic-Free Shopping',
        description: 'Complete 3 shopping trips without plastic bags',
        category: 'plastic',
        target_value: 3,
        target_unit: 'trips',
        bonus_points: 40,
        challenge_date: today,
      },
    ];

    const insertChallenge = db.prepare(`
      INSERT INTO daily_challenges (id, title, description, category, target_value, target_unit, bonus_points, challenge_date, is_active, created_at)
      VALUES (@id, @title, @description, @category, @target_value, @target_unit, @bonus_points, @challenge_date, 1, @created_at)
    `);

    challenges.forEach((challenge) => {
      insertChallenge.run({
        id: nanoid(),
        ...challenge,
        created_at: new Date().toISOString(),
      });
    });
    
    console.log(`[DB] Seeded ${challenges.length} daily challenges for ${today}`);
  }
};

// Create default admin user if it doesn't exist
const adminEmail = 'admin@greenquest.ai';
const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
if (!adminUser) {
  const adminId = nanoid();
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, points, co2_saved, is_admin, created_at)
    VALUES (@id, @name, @email, @password_hash, 0, 0, 1, @created_at)
  `).run({
    id: adminId,
    name: 'Admin User',
    email: adminEmail,
    password_hash: bcrypt.hashSync('admin123', 10), // Default password - change in production!
    created_at: new Date().toISOString(),
  });
  console.log('[DB] Created default admin user: admin@greenquest.ai / admin123');
}

seedDatabase();

module.exports = db;

