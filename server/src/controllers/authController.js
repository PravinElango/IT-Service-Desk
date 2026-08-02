const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.prepare(`
      SELECT id, name, email, password_hash, role, phone, floor, is_active
      FROM users
      WHERE email = ?
    `).get(email.trim());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.is_active !== 1) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact Super Admin.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // If engineer, fetch skills
    let skills = [];
    if (user.role === 'engineer') {
      const skillRows = db.prepare('SELECT skill FROM engineer_skills WHERE user_id = ?').all(user.id);
      skills = skillRows.map(r => r.skill);
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        floor: user.floor,
        skills
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

function getMe(req, res) {
  try {
    const user = db.prepare(`
      SELECT id, name, email, role, phone, floor, is_active, created_at
      FROM users
      WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let skills = [];
    if (user.role === 'engineer') {
      const skillRows = db.prepare('SELECT skill FROM engineer_skills WHERE user_id = ?').all(user.id);
      skills = skillRows.map(r => r.skill);
    }

    return res.json({
      success: true,
      user: {
        ...user,
        skills
      }
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = {
  login,
  getMe,
  changePassword
};
