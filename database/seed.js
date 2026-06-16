const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Clear existing data (in reverse order of foreign key dependencies)
    await client.query('DELETE FROM refresh_tokens');
    await client.query('DELETE FROM connections');
    await client.query('DELETE FROM users');

    // Seed users
    const users = [
      {
        username: 'john_doe',
        email: 'john.doe@example.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456', // bcrypt hash placeholder
        first_name: 'John',
        last_name: 'Doe',
        bio: 'Software engineer and photography enthusiast.',
        profile_picture_url: 'https://example.com/profiles/john.jpg',
        cover_photo_url: 'https://example.com/covers/john_cover.jpg',
        date_of_birth: '1990-05-15',
        gender: 'Male',
        city: 'San Francisco',
        country: 'USA',
        is_verified: true,
        is_business_account: false,
        is_active: true
      },
      {
        username: 'jane_smith',
        email: 'jane.smith@example.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123457',
        first_name: 'Jane',
        last_name: 'Smith',
        bio: 'Digital marketer and community builder.',
        profile_picture_url: 'https://example.com/profiles/jane.jpg',
        cover_photo_url: 'https://example.com/covers/jane_cover.jpg',
        date_of_birth: '1988-11-22',
        gender: 'Female',
        city: 'New York',
        country: 'USA',
        is_verified: true,
        is_business_account: true,
        is_active: true
      },
      {
        username: 'alex_wong',
        email: 'alex.wong@example.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123458',
        first_name: 'Alex',
        last_name: 'Wong',
        bio: 'Travel blogger and foodie.',
        profile_picture_url: 'https://example.com/profiles/alex.jpg',
        cover_photo_url: 'https://example.com/covers/alex_cover.jpg',
        date_of_birth: '1995-03-08',
        gender: 'Non-binary',
        city: 'London',
        country: 'UK',
        is_verified: false,
        is_business_account: false,
        is_active: true
      },
      {
        username: 'sarah_lee',
        email: 'sarah.lee@example.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123459',
        first_name: 'Sarah',
        last_name: 'Lee',
        bio: 'Small business owner and entrepreneur.',
        profile_picture_url: 'https://example.com/profiles/sarah.jpg',
        cover_photo_url: 'https://example.com/covers/sarah_cover.jpg',
        date_of_birth: '1985-07-30',
        gender: 'Female',
        city: 'Toronto',
        country: 'Canada',
        is_verified: true,
        is_business_account: true,
        is_active: true
      },
      {
        username: 'mike_chen',
        email: 'mike.chen@example.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz123460',
        first_name: 'Mike',
        last_name: 'Chen',
        bio: 'Fitness coach and wellness advocate.',
        profile_picture_url: 'https://example.com/profiles/mike.jpg',
        cover_photo_url: 'https://example.com/covers/mike_cover.jpg',
        date_of_birth: '1992-09-12',
        gender: 'Male',
        city: 'Sydney',
        country: 'Australia',
        is_verified: false,
        is_business_account: false,
        is_active: true
      }
    ];

    const insertedUsers = [];
    for (const user of users) {
      const query = `
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, bio,
          profile_picture_url, cover_photo_url, date_of_birth, gender,
          city, country, is_verified, is_business_account, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, username, email
      `;
      const values = [
        user.username, user.email, user.password_hash, user.first_name, user.last_name, user.bio,
        user.profile_picture_url, user.cover_photo_url, user.date_of_birth, user.gender,
        user.city, user.country, user.is_verified, user.is_business_account, user.is_active
      ];
      const result = await client.query(query, values);
      insertedUsers.push(result.rows[0]);
    }

    console.log(`Inserted ${insertedUsers.length} users`);

    // Seed connections
    const connections = [
      {
        requester_id: insertedUsers[0].id, // John
        addressee_id: insertedUsers[1].id, // Jane
        status: 'accepted'
      },
      {
        requester_id: insertedUsers[0].id, // John
        addressee_id: insertedUsers[2].id, // Alex
        status: 'accepted'
      },
      {
        requester_id: insertedUsers[1].id, // Jane
        addressee_id: insertedUsers[3].id, // Sarah
        status: 'accepted'
      },
      {
        requester_id: insertedUsers[2].id, // Alex
        addressee_id: insertedUsers[3].id, // Sarah
        status: 'pending'
      },
      {
        requester_id: insertedUsers[4].id, // Mike
        addressee_id: insertedUsers[0].id, // John
        status: 'rejected'
      },
      {
        requester_id: insertedUsers[4].id, // Mike
        addressee_id: insertedUsers[1].id, // Jane
        status: 'blocked'
      }
    ];

    for (const conn of connections) {
      const query = `
        INSERT INTO connections (requester_id, addressee_id, status)
        VALUES ($1, $2, $3)
      `;
      const values = [conn.requester_id, conn.addressee_id, conn.status];
      await client.query(query, values);
    }

    console.log(`Inserted ${connections.length} connections`);

    // Seed refresh tokens
    const refreshTokens = [
      {
        user_id: insertedUsers[0].id,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTY5MDAwMDAwMCwiZXhwIjoxNjkwMDg2NDAwfQ.mock_signature_1',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        revoked: false
      },
      {
        user_id: insertedUsers[1].id,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImlhdCI6MTY5MDAwMDAwMCwiZXhwIjoxNjkwMDg2NDAwfQ.mock_signature_2',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false
      },
      {
        user_id: insertedUsers[2].id,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImlhdCI6MTY5MDAwMDAwMCwiZXhwIjoxNjkwMDg2NDAwfQ.mock_signature_3',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: true
      }
    ];

    for (const rt of refreshTokens) {
      const query = `
        INSERT INTO refresh_tokens (user_id, token, expires_at, revoked)
        VALUES ($1, $2, $3, $4)
      `;
      const values = [rt.user_id, rt.token, rt.expires_at, rt.revoked];
      await client.query(query, values);
    }

    console.log(`Inserted ${refreshTokens.length} refresh tokens`);

    await client.query('COMMIT');
    console.log('Database seeded successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute if run directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };