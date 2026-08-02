const db = require('../config/db');

function getDashboardStats(req, res) {
  try {
    const user = req.user;

    // Counts
    let scopeWhere = '';
    const params = [];
    if (user.role === 'client') {
      scopeWhere = ' WHERE client_id = ?';
      params.push(user.id);
    } else if (user.role === 'engineer') {
      scopeWhere = ' WHERE assigned_engineer_id = ?';
      params.push(user.id);
    }

    const totalTickets = db.prepare(`SELECT COUNT(*) AS count FROM tickets ${scopeWhere}`).get(...params).count;
    const openTickets = db.prepare(`SELECT COUNT(*) AS count FROM tickets ${scopeWhere ? scopeWhere + ' AND' : 'WHERE'} status = 'Open'`).get(...params).count;
    const assignedTickets = db.prepare(`SELECT COUNT(*) AS count FROM tickets ${scopeWhere ? scopeWhere + ' AND' : 'WHERE'} status = 'Assigned'`).get(...params).count;
    const inProgressTickets = db.prepare(`SELECT COUNT(*) AS count FROM tickets ${scopeWhere ? scopeWhere + ' AND' : 'WHERE'} status = 'In Progress'`).get(...params).count;
    const resolvedTickets = db.prepare(`SELECT COUNT(*) AS count FROM tickets ${scopeWhere ? scopeWhere + ' AND' : 'WHERE'} status = 'Resolved'`).get(...params).count;
    const reopenedTickets = db.prepare(`SELECT COUNT(*) AS count FROM tickets ${scopeWhere ? scopeWhere + ' AND' : 'WHERE'} status = 'Reopened'`).get(...params).count;
    const criticalTickets = db.prepare(`SELECT COUNT(*) AS count FROM tickets ${scopeWhere ? scopeWhere + ' AND' : 'WHERE'} priority IN ('Critical', 'High') AND status NOT IN ('Resolved', 'Closed')`).get(...params).count;

    // Avg resolution time in minutes
    const avgResRow = db.prepare(`
      SELECT AVG(time_spent_minutes) AS avg_time, COUNT(*) AS count
      FROM ticket_resolution
    `).get();
    const avgResolutionTimeMinutes = avgResRow && avgResRow.avg_time ? Math.round(avgResRow.avg_time) : 0;

    // Tickets by Category
    const byCategory = db.prepare(`
      SELECT category, COUNT(*) AS count
      FROM tickets
      ${scopeWhere}
      GROUP BY category
      ORDER BY count DESC
    `).all(...params);

    // Tickets by Floor
    const byFloor = db.prepare(`
      SELECT floor, COUNT(*) AS count
      FROM tickets
      ${scopeWhere}
      GROUP BY floor
      ORDER BY count DESC
    `).all(...params);

    // Tickets by Priority
    const byPriority = db.prepare(`
      SELECT priority, COUNT(*) AS count
      FROM tickets
      ${scopeWhere}
      GROUP BY priority
    `).all(...params);

    // Engineer Workload (for Admin)
    let engineerWorkload = [];
    if (user.role === 'super_admin') {
      engineerWorkload = db.prepare(`
        SELECT
          u.id,
          u.name,
          u.email,
          (SELECT COUNT(*) FROM tickets WHERE assigned_engineer_id = u.id AND status IN ('Assigned', 'In Progress', 'Reopened')) AS active_tickets,
          (SELECT COUNT(*) FROM tickets WHERE assigned_engineer_id = u.id AND status = 'Resolved') AS resolved_tickets,
          (SELECT AVG(tr.time_spent_minutes) FROM ticket_resolution tr WHERE tr.engineer_id = u.id) AS avg_time_minutes
        FROM users u
        WHERE u.role = 'engineer' AND u.is_active = 1
        ORDER BY active_tickets DESC
      `).all().map(eng => ({
        ...eng,
        avg_time_minutes: eng.avg_time_minutes ? Math.round(eng.avg_time_minutes) : 0
      }));
    }

    // Recent Tickets
    const recentQuery = `
      SELECT t.id, t.ticket_code, t.category, t.sub_option, t.priority, t.status, t.created_at,
             c.name AS client_name, e.name AS engineer_name
      FROM tickets t
      LEFT JOIN users c ON t.client_id = c.id
      LEFT JOIN users e ON t.assigned_engineer_id = e.id
      ${scopeWhere}
      ORDER BY t.created_at DESC
      LIMIT 8
    `;
    const recentTickets = db.prepare(recentQuery).all(...params);

    return res.json({
      success: true,
      stats: {
        total: totalTickets,
        open: openTickets,
        assigned: assignedTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        reopened: reopenedTickets,
        critical: criticalTickets,
        avgResolutionMinutes: avgResolutionTimeMinutes
      },
      byCategory,
      byFloor,
      byPriority,
      engineerWorkload,
      recentTickets
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve stats: ' + err.message });
  }
}

module.exports = {
  getDashboardStats
};
