const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const db = require('./db');
const { analyzeImageServer, calculatePointsFromAI } = require('./ai');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'greenquest-secret';

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});

const upload = multer({ storage });

// Separate storage for ticket evidence (these are kept, not deleted)
const ticketStorage = multer.diskStorage({
  destination: (_, __, cb) => {
    const ticketDir = path.join(__dirname, 'uploads', 'tickets');
    fs.mkdirSync(ticketDir, { recursive: true });
    cb(null, ticketDir);
  },
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});

const uploadTicketEvidence = multer({ storage: ticketStorage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads/tickets', express.static(path.join(uploadsDir, 'tickets')));

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

// Health check endpoint for CLIP (before auth middleware)
app.get('/api/health/clip', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      clip: {
        model: 'CLIP VIT-B/32',
        status: 'ready',
        message: 'CLIP model will be loaded on first request (may take 30-60 seconds)',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      clip: {
        error: error.message,
      },
      message: 'CLIP model failed to initialize. Please check server logs.',
    });
  }
});

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

// Analysis-only endpoint (before submission)
app.post('/api/activities/analyze', authMiddleware, upload.single('image'), async (req, res) => {
  const { category } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ message: 'Image is required for analysis' });
  }
  
  if (!category) {
    return res.status(400).json({ message: 'Category is required' });
  }

  try {
    console.log(`[Server] Starting AI analysis for category: ${category}`);
    const aiResult = await analyzeImageServer(req.file.path, category);
    
    // Check if CLIP analysis failed
    if (aiResult.label === 'clip_error') {
      return res.status(503).json({ 
        message: 'CLIP model failed to analyze image. Please try again.',
        error: 'CLIP_ERROR',
        aiScore: aiResult.aiScore,
        label: aiResult.label,
        matches: aiResult.matches,
      });
    }
    
    res.json({
      aiScore: aiResult.aiScore,
      label: aiResult.label,
      matches: aiResult.matches,
      confidence: aiResult.confidence,
      description: aiResult.description,
      emissions: aiResult.emissions || { co2_kg: 0, energy_kwh: 0, duration_seconds: 0 },
    });
  } catch (error) {
    console.error('[Server] AI analysis error:', error);
    res.status(500).json({ 
      message: 'AI analysis failed',
      error: error.message,
      details: 'CLIP model may not be loaded. Please check server logs.'
    });
  }
});

app.post('/api/activities', authMiddleware, upload.single('image'), async (req, res) => {
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

  // No hardcoded defaults - user must provide points or it will be calculated from AI
  const basePoints = Number(points) || 0;
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

  // Server-side AI verification
  let aiResult = null;
  let aiScore = null;
  let serverAiLabel = null;
  let serverAiMatches = true;

  if (req.file) {
    try {
      console.log(`[Server] Starting AI verification for category: ${category}`);
      aiResult = await analyzeImageServer(req.file.path, category);
      aiScore = aiResult.aiScore;
      serverAiLabel = aiResult.label;
      serverAiMatches = aiResult.matches;
      console.log(`[Server] AI verification complete: matches=${serverAiMatches}, score=${aiScore}, label=${serverAiLabel}`);
    } catch (error) {
      console.error('[Server] AI verification error:', error);
      // Continue with submission even if AI fails, but mark as low confidence
      aiScore = 30; // Lower default score if AI fails
      serverAiMatches = false; // Don't assume it matches if AI fails
    }
  } else {
    console.log('[Server] No image file provided, skipping AI verification');
  }

  // Use server-side AI results if available, otherwise use client-side
  // IMPORTANT: Server-side AI takes precedence - it's more reliable
  let finalAiMatches;
  let finalAiScore;
  let finalAiLabel;
  
  if (aiResult) {
    // Server AI ran successfully - use its results
    finalAiMatches = serverAiMatches;
    finalAiScore = aiScore;
    finalAiLabel = serverAiLabel;
    console.log(`[Server] Using server-side AI results: matches=${finalAiMatches}, score=${finalAiScore}`);
  } else {
    // Neither AI ran - this should not happen if image was uploaded
    // Default to low confidence to require manual review
    finalAiMatches = false;
    finalAiScore = 20; // Very low score - needs review
    finalAiLabel = 'no_ai_verification';
    console.warn(`[Server] WARNING: No AI verification available - defaulting to low score`);
  }

  // If no base points provided, calculate from AI confidence
  let effectiveBasePoints = basePoints;
  if (effectiveBasePoints === 0 && aiResult) {
    // Calculate base points from AI confidence (20-50 points range)
    effectiveBasePoints = Math.round(20 + (aiResult.confidence * 30));
  } else if (effectiveBasePoints === 0) {
    // Minimum points if no AI and no user input
    effectiveBasePoints = 10;
  }

  // Log for debugging
  console.log(`[Server] AI Verification Results:`);
  console.log(`  - Server AI ran: ${!!aiResult}`);
  console.log(`  - Server matches: ${serverAiMatches}`);
  console.log(`  - Final matches: ${finalAiMatches}`);
  console.log(`  - Server score: ${aiScore}`);
  console.log(`  - Final score: ${finalAiScore}`);
  console.log(`  - Label: ${finalAiLabel}`);
  console.log(`  - Base points (user): ${basePoints}, Effective base: ${effectiveBasePoints}`);

  // Calculate points based on AI verification
  const finalPoints = calculatePointsFromAI(effectiveBasePoints, aiResult?.confidence || 0.3, finalAiMatches, geoBonus);
  
  console.log(`  - Final points: ${finalPoints} (base: ${basePoints}, geo bonus: ${geoBonus})`);
  const resolvedCO2 = Number(co2Saved) || Number((finalPoints * 0.12).toFixed(2));
  
  // Determine status based on AI verification
  let status = 'verified';
  if (finalAiScore < 30) {
    status = 'flagged';
  } else if (finalAiScore < 60) {
    status = 'pending';
  }

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
      (id, user_id, type, category, description, points, co2_saved, status, image_path, event_time, location, latitude, longitude, geo_accuracy, visibility, ai_score, client_ai_label, client_ai_score, created_at)
     VALUES
      (@id, @user_id, @type, @category, @description, @points, @co2_saved, @status, @image_path, @event_time, @location, @latitude, @longitude, @geo_accuracy, @visibility, @ai_score, @client_ai_label, @client_ai_score, @created_at)`
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
    ai_score: finalAiScore,
    client_ai_label: null,
    client_ai_score: null,
    created_at: now,
  });

  db.prepare(
    `UPDATE users
     SET points = points + @points,
         co2_saved = co2_saved + @co2
     WHERE id = @id`
  ).run({ points: finalPoints, co2: resolvedCO2, id: req.user.id });

  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activityId);

  // Check for daily challenge completion
  let challengeCompleted = null;
  if (finalAiMatches && finalAiScore >= 60) {
    const today = new Date().toISOString().split('T')[0];
    const relevantChallenges = db.prepare(`
      SELECT * FROM daily_challenges 
      WHERE category = ? AND challenge_date = ? AND is_active = 1
    `).all(category, today);

    for (const challenge of relevantChallenges) {
      // Check if user already completed this challenge today
      const existing = db.prepare(`
        SELECT * FROM challenge_completions 
        WHERE challenge_id = ? AND user_id = ? AND DATE(completed_at) = ?
      `).get(challenge.id, req.user.id, today);

      if (!existing) {
        // Auto-complete challenge if category matches and AI verified
        const completionId = nanoid();
        db.prepare(`
          INSERT INTO challenge_completions 
          (id, challenge_id, user_id, activity_id, evidence_value, evidence_unit, bonus_points_earned, completed_at)
          VALUES (@id, @challenge_id, @user_id, @activity_id, @evidence_value, @evidence_unit, @bonus_points, @completed_at)
        `).run({
          id: completionId,
          challenge_id: challenge.id,
          user_id: req.user.id,
          activity_id: activityId,
          evidence_value: challenge.target_value,
          evidence_unit: challenge.target_unit,
          bonus_points: challenge.bonus_points,
          completed_at: new Date().toISOString(),
        });

        // Award bonus points (already updated user points above, so add bonus separately)
        db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(challenge.bonus_points, req.user.id);
        
        challengeCompleted = {
          challengeId: challenge.id,
          title: challenge.title,
          bonusPoints: challenge.bonus_points,
        };
        
        console.log(`[Server] ✅ Challenge completed: ${challenge.title} - +${challenge.bonus_points} bonus points`);
        break; // Only complete one challenge per activity
      }
    }
  }

  // Delete the uploaded image immediately after AI assessment (as per Terms & Conditions)
  // Only keep images if they're part of an escalation ticket
  // Do this asynchronously after sending response
  if (req.file && fs.existsSync(req.file.path)) {
    const imagePathToDelete = req.file.path;
    setImmediate(() => {
      try {
        fs.unlinkSync(imagePathToDelete);
        console.log(`[Server] Deleted regular submission image: ${imagePathToDelete}`);
        // Update activity to remove image_path since file is deleted
        db.prepare('UPDATE activities SET image_path = NULL WHERE id = ?').run(activityId);
      } catch (error) {
        console.error(`[Server] Error deleting image: ${error.message}`);
      }
    });
    // Set image_path to null in response since it will be deleted
    activity.image_path = null;
  }

  res.status(201).json({
    activity,
    geoBonus,
    aiVerification: {
      score: finalAiScore,
      label: finalAiLabel,
      matches: finalAiMatches,
      confidence: aiResult?.confidence || 0.5,
      emissions: aiResult?.emissions || { co2_kg: 0, energy_kwh: 0, duration_seconds: 0 },
    },
    challengeCompleted,
    profile: buildProfileResponse(req.user.id),
  });
});

// Admin authentication middleware
const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!req.user || !req.user.is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};

// Admin login endpoint
app.post('/api/auth/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_admin = 1').get(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  return res.json({ token: generateToken(user), user: sanitizeUser(user) });
});

// Create ticket endpoint
app.post('/api/tickets', authMiddleware, uploadTicketEvidence.array('evidence', 5), (req, res) => {
  const { activityId, description, activityType, category, currentPoints, aiScore } = req.body;
  
  if (!activityId || !description || !activityType || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'At least one evidence image is required' });
  }

  // Verify activity belongs to user
  const activity = db.prepare('SELECT * FROM activities WHERE id = ? AND user_id = ?').get(activityId, req.user.id);
  if (!activity) {
    return res.status(404).json({ message: 'Activity not found' });
  }

  const ticketId = nanoid();
  const now = new Date().toISOString();

  // Create ticket
  db.prepare(`
    INSERT INTO tickets (id, activity_id, user_id, description, activity_type, category, current_points, ai_score, created_at)
    VALUES (@id, @activity_id, @user_id, @description, @activity_type, @category, @current_points, @ai_score, @created_at)
  `).run({
    id: ticketId,
    activity_id: activityId,
    user_id: req.user.id,
    description,
    activity_type: activityType,
    category,
    current_points: Number(currentPoints) || 0,
    ai_score: Number(aiScore) || 0,
    created_at: now,
  });

  // Store evidence images (these are kept, not deleted)
  const insertEvidence = db.prepare(`
    INSERT INTO ticket_evidence (id, ticket_id, image_path, created_at)
    VALUES (@id, @ticket_id, @image_path, @created_at)
  `);

  req.files.forEach((file) => {
    insertEvidence.run({
      id: nanoid(),
      ticket_id: ticketId,
      image_path: `/uploads/tickets/${path.basename(file.path)}`,
      created_at: now,
    });
  });

  const ticket = db.prepare(`
    SELECT t.*, u.name as user_name, u.email as user_email
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).get(ticketId);

  res.status(201).json({ ticket, message: 'Ticket created successfully' });
});

// Get user's tickets
app.get('/api/tickets', authMiddleware, (req, res) => {
  const tickets = db.prepare(`
    SELECT t.*, 
           (SELECT COUNT(*) FROM ticket_evidence WHERE ticket_id = t.id) as evidence_count
    FROM tickets t
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
  `).all(req.user.id);

  res.json({ tickets });
});

// Admin: Get all tickets
app.get('/api/admin/tickets', adminMiddleware, (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT t.*, u.name as user_name, u.email as user_email,
           (SELECT COUNT(*) FROM ticket_evidence WHERE ticket_id = t.id) as evidence_count
    FROM tickets t
    JOIN users u ON t.user_id = u.id
  `;
  const params = [];
  
  if (status) {
    query += ' WHERE t.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY t.created_at DESC';
  
  const tickets = db.prepare(query).all(...params);
  res.json({ tickets });
});

// Admin: Get ticket details with evidence
app.get('/api/admin/tickets/:id', adminMiddleware, (req, res) => {
  const { id } = req.params;
  
  const ticket = db.prepare(`
    SELECT t.*, u.name as user_name, u.email as user_email, a.*
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN activities a ON t.activity_id = a.id
    WHERE t.id = ?
  `).get(id);

  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  const evidence = db.prepare(`
    SELECT * FROM ticket_evidence WHERE ticket_id = ?
  `).all(id);

  res.json({ ticket, evidence });
});

// Admin: Review ticket (approve/reject)
app.post('/api/admin/tickets/:id/review', adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { action, newPoints, notes } = req.body; // action: 'approve' | 'reject'

  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) {
    return res.status(404).json({ message: 'Ticket not found' });
  }

  if (ticket.status !== 'pending') {
    return res.status(400).json({ message: 'Ticket already reviewed' });
  }

  const now = new Date().toISOString();
  const status = action === 'approve' ? 'approved' : 'rejected';

  // Update ticket
  db.prepare(`
    UPDATE tickets
    SET status = @status,
        admin_id = @admin_id,
        admin_notes = @admin_notes,
        new_points = @new_points,
        resolved_at = @resolved_at
    WHERE id = @id
  `).run({
    id,
    status,
    admin_id: req.user.id,
    admin_notes: notes || null,
    new_points: action === 'approve' && newPoints ? Number(newPoints) : null,
    resolved_at: now,
  });

  // If approved and new points provided, update activity and user points
  if (action === 'approve' && newPoints) {
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(ticket.activity_id);
    if (activity) {
      const pointsDiff = Number(newPoints) - ticket.current_points;
      
      // Update activity points
      db.prepare('UPDATE activities SET points = ? WHERE id = ?').run(newPoints, ticket.activity_id);
      
      // Update user points
      db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pointsDiff, ticket.user_id);
    }
  }

  const updatedTicket = db.prepare(`
    SELECT t.*, u.name as user_name, u.email as user_email
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).get(id);

  res.json({ ticket: updatedTicket, message: `Ticket ${action === 'approve' ? 'approved' : 'rejected'}` });
});

// Daily Challenges API
app.get('/api/challenges', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const challenges = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM challenge_completions cc 
            WHERE cc.challenge_id = c.id AND cc.user_id = ?) as user_completed,
           (SELECT bonus_points_earned FROM challenge_completions cc 
            WHERE cc.challenge_id = c.id AND cc.user_id = ? LIMIT 1) as user_bonus_earned
    FROM daily_challenges c
    WHERE c.challenge_date = ? AND c.is_active = 1
    ORDER BY c.created_at DESC
  `).all(req.user.id, req.user.id, today);

  res.json({ challenges });
});

app.post('/api/challenges/:id/complete', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { activityId, evidenceValue, evidenceUnit } = req.body;

  const challenge = db.prepare('SELECT * FROM daily_challenges WHERE id = ? AND is_active = 1').get(id);
  if (!challenge) {
    return res.status(404).json({ message: 'Challenge not found or inactive' });
  }

  // Check if already completed today
  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare(`
    SELECT * FROM challenge_completions 
    WHERE challenge_id = ? AND user_id = ? AND DATE(completed_at) = ?
  `).get(id, req.user.id, today);

  if (existing) {
    return res.status(400).json({ message: 'Challenge already completed today' });
  }

  // Verify evidence value meets target
  const value = Number(evidenceValue) || 0;
  const target = Number(challenge.target_value);
  
  if (value < target) {
    return res.status(400).json({ 
      message: `Evidence value (${value} ${challenge.target_unit}) does not meet target (${target} ${challenge.target_unit})` 
    });
  }

  // Award bonus points
  const completionId = nanoid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO challenge_completions 
    (id, challenge_id, user_id, activity_id, evidence_value, evidence_unit, bonus_points_earned, completed_at)
    VALUES (@id, @challenge_id, @user_id, @activity_id, @evidence_value, @evidence_unit, @bonus_points, @completed_at)
  `).run({
    id: completionId,
    challenge_id: id,
    user_id: req.user.id,
    activity_id: activityId || null,
    evidence_value: value,
    evidence_unit: evidenceUnit || challenge.target_unit,
    bonus_points: challenge.bonus_points,
    completed_at: now,
  });

  // Update user points
  db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(challenge.bonus_points, req.user.id);

  const completion = db.prepare('SELECT * FROM challenge_completions WHERE id = ?').get(completionId);

  res.json({ 
    completion,
    bonusPoints: challenge.bonus_points,
    message: `Challenge completed! +${challenge.bonus_points} bonus points awarded.`
  });
});

// Search API - Search users and their public activities
app.get('/api/search', authMiddleware, (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const searchTerm = `%${q.trim()}%`;
  
  // Search for users matching the query
  const users = db.prepare(`
    SELECT id, name, email, points, co2_saved
    FROM users
    WHERE name LIKE ? OR email LIKE ?
    LIMIT 20
  `).all(searchTerm, searchTerm);

  // For each user, get their public activities
  const results = users.map(user => {
    const activities = db.prepare(`
      SELECT a.*, u.name as user_name
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ? AND a.visibility = 'public'
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
      },
      activities: activities,
    };
  });

  res.json({ results });
});

// Delete activity
app.delete('/api/activities/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if activity exists and belongs to user
  const activity = db.prepare('SELECT * FROM activities WHERE id = ? AND user_id = ?').get(id, userId);
  if (!activity) {
    return res.status(404).json({ message: 'Activity not found or you do not have permission to delete it' });
  }

  // Delete associated image file if exists
  if (activity.image_path) {
    const imagePath = path.join(__dirname, activity.image_path);
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (err) {
      console.error(`[Server] Error deleting image file: ${err.message}`);
    }
  }

  // Delete the activity
  db.prepare('DELETE FROM activities WHERE id = ?').run(id);

  res.json({ message: 'Activity deleted successfully' });
});

// Rewards API
app.post('/api/rewards/redeem', authMiddleware, (req, res) => {
  const { rewardId, points } = req.body;

  if (!rewardId || !points) {
    return res.status(400).json({ message: 'Reward ID and points are required' });
  }

  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.points < points) {
    return res.status(400).json({ message: 'Insufficient points' });
  }

  // Check if reward exists
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(rewardId);
  if (!reward) {
    // If reward doesn't exist in DB, create a temporary one (for now)
    // In production, you'd want to seed rewards properly
  }

  // Deduct points
  db.prepare('UPDATE users SET points = points - ? WHERE id = ?').run(points, req.user.id);

  // Create redemption record
  const redemptionId = nanoid();
  const redemptionCode = `${rewardId.toUpperCase().substring(0, 4)}-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO redemptions (id, user_id, reward_id, points, status, redemption_code, created_at)
    VALUES (?, ?, ?, ?, 'completed', ?, ?)
  `).run(redemptionId, req.user.id, rewardId, points, redemptionCode, now);

  const redemption = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(redemptionId);

  res.json({
    redemption,
    message: 'Reward redeemed successfully',
  });
});

// Global error handler to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process - log and continue
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
  console.log(`Using CLIP VIT-B/32 for image analysis`);
  console.log(`Model will be loaded on first request (may take 30-60 seconds)`);
  console.log(`Health check: http://localhost:${PORT}/api/health/clip`);
});

