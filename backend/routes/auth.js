const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/config.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password, first_name, last_name, bio, profile_picture_url, date_of_birth } = req.body;

  if (!username || !email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Missing required fields: username, email, password, first_name, last_name' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingUserQuery = 'SELECT id FROM users WHERE username = $1 OR email = $2';
    const existingUserResult = await client.query(existingUserQuery, [username, email]);
    if (existingUserResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const insertUserQuery = `
      INSERT INTO users (username, email, password_hash, first_name, last_name, bio, profile_picture_url, date_of_birth)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, first_name, last_name, bio, profile_picture_url, date_of_birth, created_at, updated_at
    `;
    const insertUserValues = [username, email, passwordHash, first_name, last_name, bio || null, profile_picture_url || null, date_of_birth || null];
    const newUserResult = await client.query(insertUserQuery, insertUserValues);
    const newUser = newUserResult.rows[0];

    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, email: newUser.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        bio: newUser.bio,
        profile_picture_url: newUser.profile_picture_url,
        date_of_birth: newUser.date_of_birth,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      },
      token
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const client = await pool.connect();
  try {
    const userQuery = 'SELECT id, username, email, password_hash, first_name, last_name, bio, profile_picture_url, date_of_birth, created_at, updated_at FROM users WHERE email = $1';
    const userResult = await client.query(userQuery, [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        bio: user.bio,
        profile_picture_url: user.profile_picture_url,
        date_of_birth: user.date_of_birth,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  } finally {
    client.release();
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const client = await pool.connect();
  try {
    const userQuery = 'SELECT id, username, email, first_name, last_name, bio, profile_picture_url, date_of_birth, created_at, updated_at FROM users WHERE id = $1';
    const userResult = await client.query(userQuery, [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        bio: user.bio,
        profile_picture_url: user.profile_picture_url,
        date_of_birth: user.date_of_birth,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ error: 'Internal server error fetching user profile' });
  } finally {
    client.release();
  }
});

module.exports = router;