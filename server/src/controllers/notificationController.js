const db = require('../config/db');

function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const notifications = db.prepare(`
      SELECT n.*, t.ticket_code
      FROM notifications n
      LEFT JOIN tickets t ON n.ticket_id = t.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 40
    `).all(userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId).count;

    return res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications: ' + err.message });
  }
}

function markAsRead(req, res) {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.user.id);
    return res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark as read: ' + err.message });
  }
}

function markAllAsRead(req, res) {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark all as read: ' + err.message });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
