const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

/**
 * Hash a plain text password using bcrypt
 * @param {string} plainPassword - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 */
async function hashPassword(plainPassword) {
    try {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hash = await bcrypt.hash(plainPassword, salt);
        return hash;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Password hashing failed');
    }
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} plainPassword - The plain text password to check
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
async function comparePassword(plainPassword, hashedPassword) {
    try {
        const match = await bcrypt.compare(plainPassword, hashedPassword);
        return match;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        throw new Error('Password comparison failed');
    }
}

/**
 * Generate a JWT access token for a user
 * @param {object} user - The user object
 * @param {number} user.id - The user ID
 * @param {string} user.username - The username
 * @param {string} user.email - The email
 * @param {boolean} user.is_verified - Whether the user is verified
 * @param {boolean} user.is_business_account - Whether the user is a business account
 * @returns {string} - The signed JWT access token
 */
function generateAccessToken(user) {
    const payload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        is_verified: user.is_verified,
        is_business_account: user.is_business_account,
        type: 'access'
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
}

/**
 * Generate a JWT refresh token for a user
 * @param {object} user - The user object
 * @param {number} user.id - The user ID
 * @returns {string} - The signed JWT refresh token
 */
function generateRefreshToken(user) {
    const payload = {
        sub: user.id,
        type: 'refresh'
    };
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
}

/**
 * Verify a JWT access token
 * @param {string} token - The JWT token to verify
 * @returns {object} - The decoded token payload if valid
 * @throws {Error} - If token is invalid or expired
 */
function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'access') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Access token expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid access token');
        } else {
            throw error;
        }
    }
}

/**
 * Verify a JWT refresh token
 * @param {string} token - The JWT refresh token to verify
 * @returns {object} - The decoded token payload if valid
 * @throws {Error} - If token is invalid or expired
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Refresh token expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid refresh token');
        } else {
            throw error;
        }
    }
}

/**
 * Generate both access and refresh tokens for a user
 * @param {object} user - The user object
 * @returns {object} - Object containing accessToken and refreshToken
 */
function generateTokens(user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return { accessToken, refreshToken };
}

module.exports = {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokens
};