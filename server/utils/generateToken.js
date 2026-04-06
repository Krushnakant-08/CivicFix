import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for the given user ID
 * @param {string} userId - MongoDB ObjectId as string
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

export default generateToken;
