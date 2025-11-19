const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const db = require('./db');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'eco-score-secret';

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
};

const generateToken = (user) =>
  jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing authorization header' });

  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ message: 'Invalid authorization header' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const id = nanoid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, points, co2_saved, created_at)
    VALUES (@id, @name, @email, @password_hash, 0, 0, @created_at)
  `).run({
    id,
    name,
    email,
    password_hash: bcrypt.hashSync(password, 10),
    created_at: now,
  });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return res.json({ token: generateToken(user), user: sanitizeUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Update streak logic
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const lastLoginDate = user.last_login_date ? user.last_login_date.split('T')[0] : null;
  let newStreak = user.current_streak || 0;
  let streakIncreased = false;

  if (lastLoginDate !== today) {
    if (lastLoginDate) {
      const lastLogin = new Date(lastLoginDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if last login was yesterday (consecutive day)
      if (
        lastLogin.getFullYear() === yesterday.getFullYear() &&
        lastLogin.getMonth() === yesterday.getMonth() &&
        lastLogin.getDate() === yesterday.getDate()
      ) {
        // Consecutive day - increment streak
        newStreak = (user.current_streak || 0) + 1;
        streakIncreased = true;
      } else if (lastLoginDate !== today) {
        // Not consecutive - reset streak to 1 (today's login)
        newStreak = 1;
        streakIncreased = true;
      }
    } else {
      // First login ever
      newStreak = 1;
      streakIncreased = true;
    }

    // Update user's last login date and streak
    db.prepare(
      `UPDATE users 
       SET last_login_date = ?, current_streak = ? 
       WHERE id = ?`
    ).run(new Date().toISOString(), newStreak, user.id);
  }

  // Fetch updated user
  const updatedUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  return res.json({ 
    token: generateToken(updatedUser), 
    user: sanitizeUser(updatedUser),
    streakIncreased,
    currentStreak: newStreak
  });
});

const buildProfileResponse = (userId) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  const activities = db
    .prepare('SELECT * FROM activities WHERE user_id = ? ORDER BY datetime(created_at) DESC')
    .all(userId);

  const stats = {
    totalPoints: user.points,
    totalActivities: activities.length,
    co2Saved: Number(user.co2_saved.toFixed(2)),
    streakDays: user.current_streak || 0,
  };

  const forest = {
    trees: Math.floor(user.points / 10),
    progressToNext: (user.points % 10) / 10,
    pointsToNext: user.points % 10 === 0 ? 10 : 10 - (user.points % 10),
  };

  return {
    user: sanitizeUser(user),
    stats,
    forest,
    recentActivities: activities.slice(0, 10),
  };
};

app.get('/api/me', authMiddleware, (req, res) => {
  const profile = buildProfileResponse(req.user.id);
  if (!profile) return res.status(404).json({ message: 'User not found' });
  res.json(profile);
});

app.get('/api/leaderboard', (req, res) => {
  const leaders = db
    .prepare(
      `SELECT 
        u.id,
        u.name,
        u.points,
        u.co2_saved,
        u.created_at,
        IFNULL((SELECT COUNT(*) FROM activities a WHERE a.user_id = u.id), 0) AS activities
       FROM users u
       ORDER BY u.points DESC
       LIMIT 20`
    )
    .all();

  res.json({
    leaderboard: leaders.map((leader, index) => ({
      ...sanitizeUser(leader),
      activities: leader.activities,
      trustScore: 100,
      rank: index + 1,
    })),
  });
});

app.get('/api/feed', authMiddleware, (req, res) => {
  const scope = req.query.scope || 'private'; // 'public' or 'private'
  
  let query;
  if (scope === 'public') {
    query = `
      SELECT a.*, u.name as user_name, u.avatar_url
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE a.visibility = 'public' AND a.image_path IS NOT NULL
      ORDER BY datetime(COALESCE(a.event_time, a.created_at)) DESC
      LIMIT 50
    `;
    const posts = db.prepare(query).all();
    res.json({ posts });
  } else {
    // 'private' - show only the current user's private activities
    query = `
      SELECT a.*, u.name as user_name, u.avatar_url
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ? AND a.visibility = 'private' AND a.image_path IS NOT NULL
      ORDER BY datetime(COALESCE(a.event_time, a.created_at)) DESC
      LIMIT 50
    `;
    const posts = db.prepare(query).all(req.user.id);
    res.json({ posts });
  }
});

app.get('/api/activities', authMiddleware, (req, res) => {
  const scope = req.query.scope === 'all';
  const baseQuery = `
    SELECT a.*, u.name as user_name
    FROM activities a
    JOIN users u ON a.user_id = u.id
  `;
  const orderClause = 'ORDER BY datetime(COALESCE(a.event_time, a.created_at)) DESC';

  const stmt = scope
    ? db.prepare(`${baseQuery} ${orderClause}`)
    : db.prepare(`${baseQuery} WHERE a.user_id = ? ${orderClause}`);

  const activities = scope ? stmt.all() : stmt.all(req.user.id);

  res.json({ activities });
});

app.post('/api/activities', authMiddleware, upload.single('image'), (req, res) => {
  const {
    type,
    category,
    description,
    points,
    co2Saved,
    eventTime,
    location,
    latitude,
    longitude,
    geoAccuracy,
    visibility,
  } = req.body;
  if (!type || !category) {
    return res.status(400).json({ message: 'Type and category are required' });
  }

  const defaultPoints = {
    transport: 25,
    energy: 30,
    water: 20,
    waste: 20,
    food: 25,
    tree: 50,
    event: 40,
  };

  const resolvedPoints = Number(points) || defaultPoints[category] || 20;
  const latNum = latitude ? Number(latitude) : null;
  const lngNum = longitude ? Number(longitude) : null;
  const accuracyNum = geoAccuracy ? Number(geoAccuracy) : null;
  const hasGeo =
    latNum !== null &&
    lngNum !== null &&
    !Number.isNaN(latNum) &&
    !Number.isNaN(lngNum);
  const geoBonus = hasGeo
    ? Math.max(
        5,
        accuracyNum
          ? accuracyNum <= 15
            ? 12
            : accuracyNum <= 50
            ? 8
            : 5
          : 5,
      )
    : 0;
  const finalPoints = resolvedPoints + geoBonus;
  const resolvedCO2 = Number(co2Saved) || Number((finalPoints * 0.12).toFixed(2));
  const status = 'verified';
  const activityId = nanoid();
  const now = new Date().toISOString();
  const eventTimeIso = (() => {
    if (!eventTime) return now;
    const parsed = new Date(eventTime);
    return Number.isNaN(parsed.getTime()) ? now : parsed.toISOString();
  })();
  const locationText = location?.trim() || null;
  const visibilityValue = visibility === 'public' || visibility === 'community' || visibility === 'private' ? visibility : 'private';

  db.prepare(
    `INSERT INTO activities 
      (id, user_id, type, category, description, points, co2_saved, status, image_path, event_time, location, latitude, longitude, geo_accuracy, visibility, created_at)
     VALUES
      (@id, @user_id, @type, @category, @description, @points, @co2_saved, @status, @image_path, @event_time, @location, @latitude, @longitude, @geo_accuracy, @visibility, @created_at)`
  ).run({
    id: activityId,
    user_id: req.user.id,
    type,
    category,
    description: description || null,
    points: finalPoints,
    co2_saved: resolvedCO2,
    status,
    image_path: req.file ? `/uploads/${path.basename(req.file.path)}` : null,
    event_time: eventTimeIso,
    location: locationText,
    latitude: hasGeo ? latNum : null,
    longitude: hasGeo ? lngNum : null,
    geo_accuracy: hasGeo ? accuracyNum : null,
    visibility: visibilityValue,
    created_at: now,
  });

  db.prepare(
    `UPDATE users
     SET points = points + @points,
         co2_saved = co2_saved + @co2
     WHERE id = @id`
  ).run({ points: finalPoints, co2: resolvedCO2, id: req.user.id });

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId);

  res.status(201).json({
    activity,
    geoBonus,
    profile: buildProfileResponse(req.user.id),
  });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

