import User from '../models/User.js';

export const normalizeEmail = (email = '') => email.trim().toLowerCase();

export const createUsernameFromEmail = async (email, options = {}) => {
  const base = email
    .split('@')[0]
    .replace(/[^a-z0-9_.-]/gi, '')
    .toLowerCase()
    .slice(0, 28);
  const safeBase = base.length >= 3 ? base : `kwt${base}`;
  let username = safeBase;
  let counter = 1;

  while (
    await User.exists({
      username,
      ...(options.excludeUserId ? { _id: { $ne: options.excludeUserId } } : {})
    })
  ) {
    username = `${safeBase}${counter}`;
    counter += 1;
  }

  return username;
};
