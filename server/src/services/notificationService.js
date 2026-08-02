const nodemailer = require('nodemailer');
const db = require('../config/db');

let ioInstance = null;

function setSocketIO(io) {
  ioInstance = io;
}

// Setup Nodemailer transporter
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendEmail({ to, subject, html, text }) {
  if (transporter && to) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"IT Support Desk" <no-reply@company.com>',
        to,
        subject,
        text,
        html
      });
      console.log(`[Email] Sent email to ${to}: ${subject}`);
    } catch (err) {
      console.error(`[Email Error] Failed to send email to ${to}:`, err.message);
    }
  } else {
    console.log(`[Email Simulation] To: ${to} | Subject: ${subject}`);
  }
}

function createNotification({ userId, ticketId, title, message, type = 'info', link = '' }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (user_id, ticket_id, title, message, type, is_read)
      VALUES (?, ?, ?, ?, ?, 0)
    `);
    const res = stmt.run(userId, ticketId, title, message, type);
    const notificationId = res.lastInsertRowid;

    const notifData = {
      id: notificationId,
      user_id: userId,
      ticket_id: ticketId,
      title,
      message,
      type,
      link,
      is_read: 0,
      created_at: new Date().toISOString()
    };

    if (ioInstance) {
      ioInstance.to(`user_${userId}`).emit('notification', notifData);
      ioInstance.to(`user_${userId}`).emit('ticket_updated', { ticketId, type });
    }

    return notifData;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

async function notifyTicketCreated(ticket, client) {
  const admins = db.prepare(`SELECT id, name, email FROM users WHERE role = 'super_admin' AND is_active = 1`).all();

  for (const admin of admins) {
    createNotification({
      userId: admin.id,
      ticketId: ticket.id,
      title: 'New Support Ticket Raised',
      message: `${client.name} raised ticket ${ticket.ticket_code} for ${ticket.category} (${ticket.sub_option}).`,
      type: 'ticket_created'
    });

    sendEmail({
      to: admin.email,
      subject: `[New Ticket] ${ticket.ticket_code}: ${ticket.category} - ${ticket.sub_option}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2 style="color: #2563eb;">New Support Ticket Created</h2>
          <p><strong>Ticket ID:</strong> ${ticket.ticket_code}</p>
          <p><strong>Raised By:</strong> ${client.name} (${client.email})</p>
          <p><strong>Category:</strong> ${ticket.category} &rarr; ${ticket.sub_option}</p>
          <p><strong>Location / Floor:</strong> ${ticket.floor}</p>
          <p><strong>Description:</strong> ${ticket.description}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;"/>
          <p style="color: #6b7280; font-size: 12px;">Please log in to the IT Support Portal to review and assign an engineer.</p>
        </div>
      `
    });
  }

  if (ioInstance) {
    ioInstance.to('role_super_admin').emit('ticket_feed_refresh');
  }
}

async function notifyTicketAssigned(ticket, engineer, assignedByAdmin) {
  // Notify Engineer
  createNotification({
    userId: engineer.id,
    ticketId: ticket.id,
    title: 'Ticket Assigned to You',
    message: `You have been assigned to ${ticket.ticket_code} (${ticket.category} at ${ticket.floor}).`,
    type: 'ticket_assigned'
  });

  sendEmail({
    to: engineer.email,
    subject: `[Assigned] ${ticket.ticket_code}: ${ticket.category} - ${ticket.sub_option}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
        <h2 style="color: #2563eb;">New Ticket Assigned to You</h2>
        <p>Hello <strong>${engineer.name}</strong>,</p>
        <p>You have been assigned ticket <strong>${ticket.ticket_code}</strong> by ${assignedByAdmin?.name || 'Administrator'}.</p>
        <p><strong>Category:</strong> ${ticket.category} &rarr; ${ticket.sub_option}</p>
        <p><strong>Location:</strong> ${ticket.floor}</p>
        <p><strong>Asset / Contact:</strong> ${ticket.asset_id || ticket.contact_number || 'N/A'}</p>
        <p><strong>Description:</strong> ${ticket.description}</p>
      </div>
    `
  });

  // Notify Client
  createNotification({
    userId: ticket.client_id,
    ticketId: ticket.id,
    title: 'Engineer Assigned',
    message: `Engineer ${engineer.name} has been assigned to your ticket ${ticket.ticket_code}.`,
    type: 'ticket_assigned'
  });

  if (ioInstance) {
    ioInstance.emit('ticket_feed_refresh');
  }
}

async function notifyTicketResolved(ticket, resolution, engineer) {
  // Notify Client
  createNotification({
    userId: ticket.client_id,
    ticketId: ticket.id,
    title: 'Ticket Resolved',
    message: `Your ticket ${ticket.ticket_code} has been marked as Resolved by ${engineer.name}.`,
    type: 'ticket_resolved'
  });

  const client = db.prepare('SELECT email, name FROM users WHERE id = ?').get(ticket.client_id);
  if (client) {
    sendEmail({
      to: client.email,
      subject: `[Resolved] Your Ticket ${ticket.ticket_code} is Resolved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2 style="color: #16a34a;">Ticket Resolved</h2>
          <p>Hello <strong>${client.name}</strong>,</p>
          <p>Your support ticket <strong>${ticket.ticket_code}</strong> has been resolved by IT Engineer ${engineer.name}.</p>
          <p><strong>Root Cause:</strong> ${resolution.root_cause}</p>
          <p><strong>Resolution:</strong> ${resolution.resolution_notes}</p>
          <p>If you are still experiencing issues, you can reopen this ticket in your portal.</p>
        </div>
      `
    });
  }

  // Notify Admins
  const admins = db.prepare(`SELECT id FROM users WHERE role = 'super_admin' AND is_active = 1`).all();
  for (const admin of admins) {
    createNotification({
      userId: admin.id,
      ticketId: ticket.id,
      title: 'Ticket Resolved',
      message: `${engineer.name} resolved ticket ${ticket.ticket_code}.`,
      type: 'ticket_resolved'
    });
  }

  if (ioInstance) {
    ioInstance.emit('ticket_feed_refresh');
  }
}

async function notifyTicketReopened(ticket, client) {
  if (ticket.assigned_engineer_id) {
    createNotification({
      userId: ticket.assigned_engineer_id,
      ticketId: ticket.id,
      title: 'Ticket Reopened',
      message: `Client ${client.name} reopened ticket ${ticket.ticket_code}. Status changed back to In Progress.`,
      type: 'ticket_reopened'
    });
  }

  const admins = db.prepare(`SELECT id FROM users WHERE role = 'super_admin' AND is_active = 1`).all();
  for (const admin of admins) {
    createNotification({
      userId: admin.id,
      ticketId: ticket.id,
      title: 'Ticket Reopened',
      message: `Ticket ${ticket.ticket_code} was reopened by ${client.name}.`,
      type: 'ticket_reopened'
    });
  }

  if (ioInstance) {
    ioInstance.emit('ticket_feed_refresh');
  }
}

async function notifyNewComment(ticket, comment, author) {
  // If author is client -> notify assigned engineer and admins
  if (author.role === 'client') {
    if (ticket.assigned_engineer_id) {
      createNotification({
        userId: ticket.assigned_engineer_id,
        ticketId: ticket.id,
        title: `New Comment on ${ticket.ticket_code}`,
        message: `${author.name}: "${comment.message.substring(0, 80)}..."`,
        type: 'new_comment'
      });
    }
  } else {
    // Engineer or Admin commented -> notify client
    if (author.id !== ticket.client_id) {
      createNotification({
        userId: ticket.client_id,
        ticketId: ticket.id,
        title: `New Update on ${ticket.ticket_code}`,
        message: `${author.name}: "${comment.message.substring(0, 80)}..."`,
        type: 'new_comment'
      });
    }
  }

  if (ioInstance) {
    ioInstance.to(`ticket_${ticket.id}`).emit('new_comment', {
      ticketId: ticket.id,
      comment
    });
  }
}

function logAudit(ticketId, action, performedBy, details = '') {
  try {
    db.prepare(`
      INSERT INTO audit_log (ticket_id, action, performed_by, details)
      VALUES (?, ?, ?, ?)
    `).run(ticketId, action, performedBy, details);
  } catch (err) {
    console.error('Error logging audit:', err);
  }
}

module.exports = {
  setSocketIO,
  createNotification,
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyTicketResolved,
  notifyTicketReopened,
  notifyNewComment,
  logAudit
};
