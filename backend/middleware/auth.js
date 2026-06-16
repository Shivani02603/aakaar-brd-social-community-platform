const { verifyAccessToken } = require('../services/authService');

/**
 * JWT authentication middleware
 * Verifies the access token from the Authorization header
 * Attaches the decoded user payload to req.user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'No authorization header provided'
        });
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            error: 'Invalid authorization header',
            message: 'Authorization header must be in format: Bearer <token>'
        });
    }
    
    const token = parts[1];
    
    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.message === 'Access token expired') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Access token has expired, please refresh your token'
            });
        } else if (error.message === 'Invalid access token' || error.message === 'Invalid token type') {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Access token is invalid'
            });
        } else {
            console.error('JWT verification error:', error);
            return res.status(500).json({
                error: 'Authentication error',
                message: 'An error occurred during authentication'
            });
        }
    }
}

/**
 * Middleware to require user verification
 * Must be used after authenticateJWT
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function requireVerifiedUser(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'User must be authenticated first'
        });
    }
    
    if (!req.user.is_verified) {
        return res.status(403).json({
            error: 'Account not verified',
            message: 'Your account must be verified to access this resource'
        });
    }
    
    next();
}

/**
 * Middleware to require business account
 * Must be used after authenticateJWT
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function requireBusinessAccount(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'User must be authenticated first'
        });
    }
    
    if (!req.user.is_business_account) {
        return res.status(403).json({
            error: 'Business account required',
            message: 'This resource is only available for business accounts'
        });
    }
    
    next();
}

/**
 * Middleware to require admin privileges
 * Must be used after authenticateJWT
 * Note: This assumes there's an is_admin field in the user object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'User must be authenticated first'
        });
    }
    
    if (!req.user.is_admin) {
        return res.status(403).json({
            error: 'Admin privileges required',
            message: 'This resource is only available for administrators'
        });
    }
    
    next();
}

/**
 * Optional authentication middleware
 * Similar to authenticateJWT but doesn't fail if no token is provided
 * Attaches user to req.user if token is valid, otherwise req.user remains undefined
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
function optionalAuthenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        req.user = undefined;
        return next();
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        req.user = undefined;
        return next();
    }
    
    const token = parts[1];
    
    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        req.user = undefined;
        next();
    }
}

module.exports = {
    authenticateJWT,
    requireVerifiedUser,
    requireBusinessAccount,
    requireAdmin,
    optionalAuthenticateJWT
};