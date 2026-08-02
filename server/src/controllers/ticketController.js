const db = require('../config/db');
const notificationService = require('../services/notificationService');

function generateTicketCode() {
  const currentYear = new Date().getFullYear();
  const latest = db.prepare(`
    SELECT ticket_code FROM tickets
    WHERE ticket_code LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`TCK-${currentYear}-%`);

  let nextNum = 1;
  if (latest && latest.ticket_code) {
    const parts = latest.ticket_code.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }
  }

  const paddedNum = String(nextNum).padStart(5, '0');
  return `TCK-${currentYear}-${paddedNum}`;
}

function createTicket(req, res) {
  try {
    const { category, sub_option, description, asset_id, contact_number, floor, priority } = req.body;
    const clientId = req.user.id;

    if (!category || !sub_option || !description || !floor) {
      return res.status(400).json({
        success: false,
        message: 'Category, sub-option, description, and floor/location are required.'
      });
    }

    const trimmedAsset = asset_id ? asset_id.trim() : '';
    const trimmedContact = contact_number ? contact_number.trim() : '';

    if (!trimmedAsset && !trimmedContact) {
      return res.status(400).json({
        success: false,
        message: 'At least one of System Asset ID or Contact Number is required.'
      });
    }

    const ticketCode = generateTicketCode();
    const ticketPriority = priority || 'Medium';

    const insertStmt = db.prepare(`
      INSERT INTO tickets (
        ticket_code, client_id, category, sub_option, description,
        asset_id, contact_number, floor, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')
    `);

    const result = insertStmt.run(
      ticketCode,
      clientId,
      category.trim(),
      sub_option.trim(),
      description.trim(),
      trimmedAsset || null,
      trimmedContact || null,
      floor.trim(),
      ticketPriority
    );

    const ticketId = result.lastInsertRowid;

    // Handle file attachments if uploaded
    if (req.files && req.files.length > 0) {
      const insertAtt = db.prepare(`
        INSERT INTO ticket_attachments (ticket_id, file_name, file_path, file_type, file_size)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const file of req.files) {
        insertAtt.run(ticketId, file.originalname, `/uploads/${file.filename}`, file.mimetype, file.size);
      }
    }

    const newTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    const attachments = db.prepare('SELECT * FROM ticket_attachments WHERE ticket_id = ?').all(ticketId);

    // Audit log
    notificationService.logAudit(ticketId, 'TICKET_CREATED', clientId, `Ticket raised by ${req.user.name}`);

    // Notify Super Admin
    notificationService.notifyTicketCreated(newTicket, req.user);

    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: {
        ...newTicket,
        attachments
      }
    });
  } catch (err) {
    console.error('createTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create ticket: ' + err.message });
  }
}

function getTickets(req, res) {
  try {
    const { status, category, priority, floor, search, engineer_id, page = 1, limit = 50 } = req.query;
    const user = req.user;

    let query = `
      SELECT
        t.*,
        c.name AS client_name,
        c.email AS client_email,
        c.phone AS client_phone,
        e.name AS engineer_name,
        e.email AS engineer_email,
        r.resolution_notes,
        r.root_cause,
        r.time_spent_minutes,
        (SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.id) AS comments_count
      FROM tickets t
      LEFT JOIN users c ON t.client_id = c.id
      LEFT JOIN users e ON t.assigned_engineer_id = e.id
      LEFT JOIN ticket_resolution r ON t.id = r.ticket_id
      WHERE 1=1
    `;
    const params = [];

    // Role-based scoping
    if (user.role === 'client') {
      query += ` AND t.client_id = ?`;
      params.push(user.id);
    } else if (user.role === 'engineer') {
      if (req.query.view === 'unassigned') {
        query += ` AND t.status = 'Open'`;
      } else {
        query += ` AND t.assigned_engineer_id = ?`;
        params.push(user.id);
      }
    } else if (user.role === 'super_admin') {
      if (engineer_id) {
        query += ` AND t.assigned_engineer_id = ?`;
        params.push(engineer_id);
      }
    }

    if (status && status !== 'all') {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (category && category !== 'all') {
      query += ` AND t.category = ?`;
      params.push(category);
    }

    if (priority && priority !== 'all') {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }

    if (floor && floor !== 'all') {
      query += ` AND t.floor = ?`;
      params.push(floor);
    }

    if (search) {
      const term = `%${search.trim()}%`;
      query += ` AND (t.ticket_code LIKE ? OR t.description LIKE ? OR t.asset_id LIKE ? OR t.contact_number LIKE ? OR c.name LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY t.id DESC`;

    const tickets = db.prepare(query).all(...params);

    return res.json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (err) {
    console.error('getTickets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve tickets: ' + err.message });
  }
}

function getTicketById(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const ticket = db.prepare(`
      SELECT
        t.*,
        c.name AS client_name,
        c.email AS client_email,
        c.phone AS client_phone,
        c.floor AS client_default_floor,
        e.name AS engineer_name,
        e.email AS engineer_email,
        e.phone AS engineer_phone
      FROM tickets t
      LEFT JOIN users c ON t.client_id = c.id
      LEFT JOIN users e ON t.assigned_engineer_id = e.id
      WHERE t.id = ? OR t.ticket_code = ?
    `).get(id, id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Role-based security check
    if (user.role === 'client' && ticket.client_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this ticket.' });
    }

    // Fetch comments
    const comments = db.prepare(`
      SELECT
        tc.*,
        u.name AS user_name,
        u.role AS user_role,
        u.email AS user_email
      FROM ticket_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = ?
      ORDER BY tc.created_at ASC
    `).all(ticket.id);

    // Fetch resolution details
    const resolution = db.prepare(`
      SELECT
        tr.*,
        u.name AS engineer_name
      FROM ticket_resolution tr
      JOIN users u ON tr.engineer_id = u.id
      WHERE tr.ticket_id = ?
    `).get(ticket.id);

    // Fetch audit history
    const auditLogs = db.prepare(`
      SELECT
        al.*,
        u.name AS performer_name,
        u.role AS performer_role
      FROM audit_log al
      LEFT JOIN users u ON al.performed_by = u.id
      WHERE al.ticket_id = ?
      ORDER BY al.timestamp ASC
    `).all(ticket.id);

    // Fetch attachments
    const attachments = db.prepare(`
      SELECT * FROM ticket_attachments
      WHERE ticket_id = ?
      ORDER BY id ASC
    `).all(ticket.id);

    return res.json({
      success: true,
      ticket: {
        ...ticket,
        comments,
        resolution: resolution || null,
        auditLogs,
        attachments
      }
    });
  } catch (err) {
    console.error('getTicketById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve ticket: ' + err.message });
  }
}

function assignEngineer(req, res) {
  try {
    const { id } = req.params;
    const { engineer_id, priority } = req.body;

    if (!engineer_id) {
      return res.status(400).json({ success: false, message: 'Engineer ID is required for assignment.' });
    }

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const engineer = db.prepare("SELECT id, name, email, role, is_active FROM users WHERE id = ? AND role = 'engineer'").get(engineer_id);
    if (!engineer || engineer.is_active !== 1) {
      return res.status(400).json({ success: false, message: 'Selected IT engineer is invalid or inactive.' });
    }

    const newPriority = priority || ticket.priority;

    db.prepare(`
      UPDATE tickets
      SET assigned_engineer_id = ?,
          status = 'Assigned',
          priority = ?,
          assigned_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(engineer.id, newPriority, ticket.id);

    const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket.id);

    notificationService.logAudit(
      ticket.id,
      'TICKET_ASSIGNED',
      req.user.id,
      `Assigned to ${engineer.name} by ${req.user.name} (Priority: ${newPriority})`
    );

    notificationService.notifyTicketAssigned(updatedTicket, engineer, req.user);

    return res.json({
      success: true,
      message: `Ticket successfully assigned to ${engineer.name}`,
      ticket: updatedTicket
    });
  } catch (err) {
    console.error('assignEngineer error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign engineer: ' + err.message });
  }
}

function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const validStatuses = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Role check: engineer can only update status of their assigned tickets
    if (req.user.role === 'engineer' && ticket.assigned_engineer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update tickets assigned to you.' });
    }

    const newStatus = status || ticket.status;
    const newPriority = priority || ticket.priority;

    db.prepare(`
      UPDATE tickets
      SET status = ?, priority = ?
      WHERE id = ?
    `).run(newStatus, newPriority, ticket.id);

    const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket.id);

    notificationService.logAudit(
      ticket.id,
      'STATUS_UPDATED',
      req.user.id,
      `Status changed from "${ticket.status}" to "${newStatus}" by ${req.user.name}`
    );

    return res.json({
      success: true,
      message: `Status updated to ${newStatus}`,
      ticket: updatedTicket
    });
  } catch (err) {
    console.error('updateStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update status: ' + err.message });
  }
}

function resolveTicket(req, res) {
  try {
    const { id } = req.params;
    const { resolution_notes, root_cause, time_spent_minutes } = req.body;

    if (!resolution_notes || !root_cause || time_spent_minutes === undefined || time_spent_minutes === '') {
      return res.status(400).json({
        success: false,
        message: 'Mandatory resolution details missing: resolution notes, root cause, and time spent (in minutes) are required.'
      });
    }

    const parsedTime = parseInt(time_spent_minutes, 10);
    if (isNaN(parsedTime) || parsedTime < 0) {
      return res.status(400).json({
        success: false,
        message: 'Time spent must be a valid non-negative number in minutes.'
      });
    }

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Role check
    if (req.user.role === 'engineer' && ticket.assigned_engineer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the assigned engineer or an administrator can resolve this ticket.' });
    }

    // Remove any previous resolution row for this ticket
    db.prepare('DELETE FROM ticket_resolution WHERE ticket_id = ?').run(ticket.id);

    // Insert resolution
    db.prepare(`
      INSERT INTO ticket_resolution (ticket_id, engineer_id, resolution_notes, root_cause, time_spent_minutes)
      VALUES (?, ?, ?, ?, ?)
    `).run(ticket.id, req.user.id, resolution_notes.trim(), root_cause.trim(), parsedTime);

    // Update ticket status
    db.prepare(`
      UPDATE tickets
      SET status = 'Resolved',
          resolved_at = CURRENT_TIMESTAMP,
          closed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ticket.id);

    const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket.id);
    const resolutionRecord = db.prepare('SELECT * FROM ticket_resolution WHERE ticket_id = ?').get(ticket.id);

    notificationService.logAudit(
      ticket.id,
      'TICKET_RESOLVED',
      req.user.id,
      `Resolved by ${req.user.name}. Cause: ${root_cause.trim()} (${parsedTime} mins)`
    );

    notificationService.notifyTicketResolved(updatedTicket, resolutionRecord, req.user);

    return res.json({
      success: true,
      message: 'Ticket resolved and closed successfully',
      ticket: updatedTicket,
      resolution: resolutionRecord
    });
  } catch (err) {
    console.error('resolveTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resolve ticket: ' + err.message });
  }
}

function reopenTicket(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Role check: Client can only reopen their own ticket
    if (req.user.role === 'client' && ticket.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only reopen your own tickets.' });
    }

    if (ticket.status !== 'Resolved' && ticket.status !== 'Closed') {
      return res.status(400).json({ success: false, message: 'Only resolved or closed tickets can be reopened.' });
    }

    db.prepare(`
      UPDATE tickets
      SET status = 'Reopened',
          resolved_at = NULL,
          closed_at = NULL
      WHERE id = ?
    `).run(ticket.id);

    if (reason && reason.trim()) {
      db.prepare(`
        INSERT INTO ticket_comments (ticket_id, user_id, message)
        VALUES (?, ?, ?)
      `).run(ticket.id, req.user.id, `[Ticket Reopened] Reason: ${reason.trim()}`);
    }

    const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticket.id);

    notificationService.logAudit(
      ticket.id,
      'TICKET_REOPENED',
      req.user.id,
      `Reopened by ${req.user.name}. Reason: ${reason || 'Issue persists'}`
    );

    notificationService.notifyTicketReopened(updatedTicket, req.user);

    return res.json({
      success: true,
      message: 'Ticket reopened successfully. Status changed to Reopened.',
      ticket: updatedTicket
    });
  } catch (err) {
    console.error('reopenTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reopen ticket: ' + err.message });
  }
}

function addComment(req, res) {
  try {
    const { id } = req.params;
    const { message, is_internal = 0 } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Comment message cannot be empty.' });
    }

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (req.user.role === 'client' && ticket.client_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const result = db.prepare(`
      INSERT INTO ticket_comments (ticket_id, user_id, message, is_internal)
      VALUES (?, ?, ?, ?)
    `).run(ticket.id, req.user.id, message.trim(), is_internal ? 1 : 0);

    const newComment = db.prepare(`
      SELECT tc.*, u.name AS user_name, u.role AS user_role, u.email AS user_email
      FROM ticket_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?
    `).get(result.lastInsertRowid);

    notificationService.logAudit(
      ticket.id,
      'COMMENT_ADDED',
      req.user.id,
      `Comment added by ${req.user.name}`
    );

    notificationService.notifyNewComment(ticket, newComment, req.user);

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully',
      comment: newComment
    });
  } catch (err) {
    console.error('addComment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to post comment: ' + err.message });
  }
}

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  assignEngineer,
  updateStatus,
  resolveTicket,
  reopenTicket,
  addComment
};
