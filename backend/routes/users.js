const express = require('express');
const { pool } = require('../database/config.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  const client = await pool.connect();
  try {
    let query = 'SELECT id, username, email, first_name, last_name, bio, profile_picture_url, date_of_birth, created_at, updated_at FROM users';
    let countQuery = 'SELECT COUNT(*) FROM users';
    const queryParams = [];
    const countParams = [];

    if (search) {
      query += ' WHERE username ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1';
      countQuery += ' WHERE username ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1';
      queryParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(parseInt(limit), offset);

    const usersResult = await client.query(query, queryParams);
    const countResult = await client.query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      users: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalUsers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error fetching users' });
  } finally {
    client.release();
  }
});

router.get('/:id', async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  const client = await pool.connect();
  try {
    const userQuery = 'SELECT id, username, email, first_name, last_name, bio, profile_picture_url, date_of_birth, created_at, updated_at FROM users WHERE id = $1';
    const userResult = await client.query(userQuery, [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Fetch user by ID error:', error);
    res.status(500).json({ error: 'Internal server error fetching user' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const { username, email, first_name, last_name, bio, profile_picture_url, date_of_birth } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'You can only update your own profile' });
  }

  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingUserQuery = 'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3';
    const existingUserResult = await client.query(existingUserQuery, [username, email, userId]);
    if (existingUserResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Username or email already taken by another user' });
    }

    const updateQuery = `
      UPDATE users
      SET username = COALESCE($1, username),
          email = COALESCE($2, email),
          first_name = COALESCE($3, first_name),
          last_name = COALESCE($4, last_name),
          bio = COALESCE($5, bio),
          profile_picture_url = COALESCE($6, profile_picture_url),
          date_of_birth = COALESCE($7, date_of_birth),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, username, email, first_name, last_name, bio, profile_picture_url, date_of_birth, created_at, updated_at
    `;
    const updateValues = [username || null, email || null, first_name, last_name, bio || null, profile_picture_url || null, date_of_birth || null, userId];
    const updateResult = await client.query(updateQuery, updateValues);
    const updatedUser = updateResult.rows[0];

    if (!updatedUser) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT');
    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error updating user' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'You can only delete your own account' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const deleteQuery = 'DELETE FROM users WHERE id = $1 RETURNING id, username, email';
    const deleteResult = await client.query(deleteQuery, [userId]);
    const deletedUser = deleteResult.rows[0];

    if (!deletedUser) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT');
    res.status(200).json({
      message: 'User deleted successfully',
      deletedUser: {
        id: deletedUser.id,
        username: deletedUser.username,
        email: deletedUser.email
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error deleting user' });
  } finally {
    client.release();
  }
});

module.exports = router;