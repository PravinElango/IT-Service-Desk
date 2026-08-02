const bcrypt = require('bcryptjs');
const db = require('../config/db');

function getUsers(req, res) {
  try {
    const { role, is_active, search } = req.query;

    let query = `
      SELECT id, name, email, role, phone, floor, is_active, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'all') {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (is_active !== undefined && is_active !== 'all') {
      query += ` AND is_active = ?`;
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    if (search) {
      const term = `%${search.trim()}%`;
      query += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY created_at DESC`;

    const users = db.prepare(query).all(...params);

    // Attach engineer skills
    const skillsStmt = db.prepare('SELECT skill FROM engineer_skills WHERE user_id = ?');
    const enriched = users.map(u => {
      if (u.role === 'engineer') {
        const skills = skillsStmt.all(u.id).map(s => s.skill);
        return { ...u, skills };
      }
      return u;
    });

    return res.json({ success: true, count: enriched.length, users: enriched });
  } catch (err) {
    console.error('getUsers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users: ' + err.message });
  }
}

function getEngineers(req, res) {
  try {
    const { category } = req.query;

    const engineers = db.prepare(`
      SELECT id, name, email, phone, floor, is_active,
             (SELECT COUNT(*) FROM tickets WHERE assigned_engineer_id = users.id AND status IN ('Assigned', 'In Progress', 'Reopened')) AS active_tickets_count
      FROM users
      WHERE role = 'engineer' AND is_active = 1
      ORDER BY name ASC
    `).all();

    const skillStmt = db.prepare('SELECT skill FROM engineer_skills WHERE user_id = ?');

    const result = engineers.map(eng => {
      const skills = skillStmt.all(eng.id).map(s => s.skill);
      const matchesCategory = category ? skills.includes(category) : false;
      return {
        ...eng,
        skills,
        matchesCategory
      };
    });

    return res.json({ success: true, engineers: result });
  } catch (err) {
    console.error('getEngineers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve engineers: ' + err.message });
  }
}

function createUser(req, res) {
  try {
    const { name, email, password, role, phone, floor, skills } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    const validRoles = ['super_admin', 'engineer', 'client'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, floor, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(name.trim(), email.trim().toLowerCase(), passwordHash, role, phone || null, floor || null);

    const userId = result.lastInsertRowid;

    if (role === 'engineer' && Array.isArray(skills) && skills.length > 0) {
      const insertSkill = db.prepare('INSERT INTO engineer_skills (user_id, skill) VALUES (?, ?)');
      for (const skill of skills) {
        insertSkill.run(userId, skill.trim());
      }
    }

    const createdUser = db.prepare('SELECT id, name, email, role, phone, floor, is_active, created_at FROM users WHERE id = ?').get(userId);
    let userSkills = [];
    if (role === 'engineer') {
      userSkills = db.prepare('SELECT skill FROM engineer_skills WHERE user_id = ?').all(userId).map(s => s.skill);
    }

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { ...createdUser, skills: userSkills }
    });
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create user: ' + err.message });
  }
}

function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role, phone, floor, is_active, skills } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim(), id);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another account.' });
      }
    }

    let passwordHash = user.password_hash;
    if (password && password.trim()) {
      passwordHash = bcrypt.hashSync(password.trim(), 10);
    }

    const updatedRole = role || user.role;
    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : user.is_active;

    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, password_hash = ?, role = ?, phone = ?, floor = ?, is_active = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : user.name,
      email ? email.trim().toLowerCase() : user.email,
      passwordHash,
      updatedRole,
      phone !== undefined ? phone : user.phone,
      floor !== undefined ? floor : user.floor,
      updatedActive,
      id
    );

    if (updatedRole === 'engineer' && Array.isArray(skills)) {
      db.prepare('DELETE FROM engineer_skills WHERE user_id = ?').run(id);
      const insertSkill = db.prepare('INSERT INTO engineer_skills (user_id, skill) VALUES (?, ?)');
      for (const skill of skills) {
        if (skill && skill.trim()) {
          insertSkill.run(id, skill.trim());
        }
      }
    }

    const updatedUser = db.prepare('SELECT id, name, email, role, phone, floor, is_active, created_at FROM users WHERE id = ?').get(id);
    let userSkills = [];
    if (updatedRole === 'engineer') {
      userSkills = db.prepare('SELECT skill FROM engineer_skills WHERE user_id = ?').all(id).map(s => s.skill);
    }

    return res.json({
      success: true,
      message: 'User updated successfully',
      user: { ...updatedUser, skills: userSkills }
    });
  } catch (err) {
    console.error('updateUser error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user: ' + err.message });
  }
}

function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT id, is_active, role FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
    }

    const newStatus = user.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, id);

    return res.json({
      success: true,
      message: `User ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
      is_active: newStatus
    });
  } catch (err) {
    console.error('toggleUserStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle user status: ' + err.message });
  }
}

function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    // If engineer has assigned active tickets, unassign them and reset status to Open
    if (user.role === 'engineer') {
      db.prepare(`
        UPDATE tickets
        SET assigned_engineer_id = NULL,
            status = 'Open'
        WHERE assigned_engineer_id = ? AND status IN ('Assigned', 'In Progress')
      `).run(id);

      // Clean up engineer skills
      db.prepare('DELETE FROM engineer_skills WHERE user_id = ?').run(id);
    }

    // Delete user
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    return res.json({
      success: true,
      message: `${user.role === 'engineer' ? 'Engineer' : 'User'} "${user.name}" removed successfully.`
    });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user: ' + err.message });
  }
}

module.exports = {
  getUsers,
  getEngineers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser
};
