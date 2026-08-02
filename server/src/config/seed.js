const bcrypt = require('bcryptjs');
const db = require('./db');

function seedDatabase() {
  console.log('--- Seeding Database ---');

  // 1. Locations
  const locations = ['1st Floor', '2nd Floor', '3rd Floor', 'Server Room / IT Dept'];
  const insertLoc = db.prepare('INSERT OR IGNORE INTO locations (name) VALUES (?)');
  for (const loc of locations) {
    insertLoc.run(loc);
  }

  // 2. Categories & Sub-options
  const categories = [
    {
      name: 'PC Issue',
      description: 'Desktop computer hardware, OS, and system failures',
      icon: 'Monitor',
      subOptions: [
        'PC not booting',
        'Power on, no display',
        'Hanging',
        'Software issue'
      ]
    },
    {
      name: 'Laptop Issue',
      description: 'Notebook hardware, battery, charging, display, and OS issues',
      icon: 'Laptop',
      subOptions: [
        'Laptop not booting',
        'Power on, no display',
        'Hanging',
        'Software issue'
      ]
    },
    {
      name: 'Printer Issue',
      description: 'Printers, scanners, cartridge, queue, and driver problems',
      icon: 'Printer',
      subOptions: [
        'Printing not coming',
        'Print error',
        'Scan problem',
        'Software not working'
      ]
    },
    {
      name: 'Network Issue',
      description: 'LAN, Wi-Fi connectivity, VPN, bandwidth, and IP assignment issues',
      icon: 'Wifi',
      subOptions: [
        'Network not connecting',
        'Network slow issue',
        'Wifi not connect'
      ]
    }
  ];

  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)');
  const insertSub = db.prepare('INSERT OR IGNORE INTO sub_options (category_name, name) VALUES (?, ?)');

  for (const cat of categories) {
    insertCat.run(cat.name, cat.description, cat.icon);
    for (const sub of cat.subOptions) {
      insertSub.run(cat.name, sub);
    }
  }

  // 3. Users
  const passwordHashAdmin = bcrypt.hashSync('Admin@123', 10);
  const passwordHashEngineer = bcrypt.hashSync('Engineer@123', 10);
  const passwordHashClient = bcrypt.hashSync('Client@123', 10);

  const users = [
    {
      name: 'Super Admin',
      email: 'admin@support.com',
      password_hash: passwordHashAdmin,
      role: 'super_admin',
      phone: '+1-555-0100',
      floor: '3rd Floor'
    },
    {
      name: 'Alex Rivera (Hardware Specialist)',
      email: 'hw.engineer@support.com',
      password_hash: passwordHashEngineer,
      role: 'engineer',
      phone: '+1-555-0120',
      floor: 'Server Room / IT Dept',
      skills: ['PC Issue', 'Laptop Issue']
    },
    {
      name: 'David Chen (Network Engineer)',
      email: 'net.engineer@support.com',
      password_hash: passwordHashEngineer,
      role: 'engineer',
      phone: '+1-555-0121',
      floor: 'Server Room / IT Dept',
      skills: ['Network Issue']
    },
    {
      name: 'Elena Rostova (Peripherals & Print)',
      email: 'print.engineer@support.com',
      password_hash: passwordHashEngineer,
      role: 'engineer',
      phone: '+1-555-0122',
      floor: 'Server Room / IT Dept',
      skills: ['Printer Issue']
    },
    {
      name: 'John Miller (Operations)',
      email: 'client@company.com',
      password_hash: passwordHashClient,
      role: 'client',
      phone: '+1-555-0101',
      floor: '1st Floor'
    },
    {
      name: 'Sarah Jenkins (Finance)',
      email: 'sarah@company.com',
      password_hash: passwordHashClient,
      role: 'client',
      phone: '+1-555-0102',
      floor: '2nd Floor'
    }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password_hash, role, phone, floor)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertSkill = db.prepare(`
    INSERT INTO engineer_skills (user_id, skill) VALUES (?, ?)
  `);

  for (const user of users) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
    let userId;
    if (!existing) {
      const res = insertUser.run(user.name, user.email, user.password_hash, user.role, user.phone, user.floor);
      userId = res.lastInsertRowid;
    } else {
      userId = existing.id;
    }

    if (user.skills && user.skills.length > 0) {
      db.prepare('DELETE FROM engineer_skills WHERE user_id = ?').run(userId);
      for (const skill of user.skills) {
        insertSkill.run(userId, skill);
      }
    }
  }

  // 4. Sample Tickets
  const clientUser = db.prepare('SELECT id FROM users WHERE email = ?').get('client@company.com');
  const sarahUser = db.prepare('SELECT id FROM users WHERE email = ?').get('sarah@company.com');
  const hwEng = db.prepare('SELECT id FROM users WHERE email = ?').get('hw.engineer@support.com');
  const netEng = db.prepare('SELECT id FROM users WHERE email = ?').get('net.engineer@support.com');
  const printEng = db.prepare('SELECT id FROM users WHERE email = ?').get('print.engineer@support.com');
  const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@support.com');

  const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;

  if (ticketCount === 0 && clientUser && sarahUser) {
    const insertTicket = db.prepare(`
      INSERT INTO tickets (
        ticket_code, client_id, category, sub_option, description,
        asset_id, contact_number, floor, priority, status,
        assigned_engineer_id, created_at, assigned_at, resolved_at, closed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?), datetime('now', ?), datetime('now', ?))
    `);

    // Ticket 1: Open
    insertTicket.run(
      'TCK-2026-00001',
      clientUser.id,
      'PC Issue',
      'Hanging',
      'The desktop freezes completely whenever Excel and Chrome are open simultaneously.',
      'ASSET-PC-1042',
      '+1-555-0101',
      '1st Floor',
      'High',
      'Open',
      null,
      '-3 hours',
      null,
      null,
      null
    );

    // Ticket 2: Assigned
    insertTicket.run(
      'TCK-2026-00002',
      sarahUser.id,
      'Network Issue',
      'Wifi not connect',
      'Cannot connect to the Corp_Secure Wi-Fi from the 2nd floor conference area.',
      null,
      '+1-555-0102',
      '2nd Floor',
      'Critical',
      'Assigned',
      netEng ? netEng.id : null,
      '-5 hours',
      '-4 hours',
      null,
      null
    );

    // Ticket 3: In Progress with comments
    const t3Res = insertTicket.run(
      'TCK-2026-00003',
      clientUser.id,
      'Printer Issue',
      'Print error',
      'Finance departmental printer is showing Paper Jam error code #0x82 even after clearing paper tray.',
      'PRNT-HP-401',
      '+1-555-0101',
      '1st Floor',
      'Medium',
      'In Progress',
      printEng ? printEng.id : null,
      '-1 day',
      '-22 hours',
      null,
      null
    );

    const t3Id = t3Res.lastInsertRowid;
    if (t3Id && printEng) {
      db.prepare("INSERT INTO ticket_comments (ticket_id, user_id, message, created_at) VALUES (?, ?, ?, datetime('now', '-20 hours'))")
        .run(t3Id, printEng.id, 'I have checked the roller sensors remotely. Heading over with a replacement roller unit.');
      db.prepare("INSERT INTO ticket_comments (ticket_id, user_id, message, created_at) VALUES (?, ?, ?, datetime('now', '-18 hours'))")
        .run(t3Id, clientUser.id, 'Thank you Elena, the device is on desk 14 next to the water dispenser.');
    }

    // Ticket 4: Resolved with resolution details
    const t4Res = insertTicket.run(
      'TCK-2026-00004',
      sarahUser.id,
      'Laptop Issue',
      'Laptop not booting',
      'Dell Latitude powers on but screen stays black and power LED blinks amber.',
      'ASSET-LT-8819',
      '+1-555-0102',
      '2nd Floor',
      'High',
      'Resolved',
      hwEng ? hwEng.id : null,
      '-2 days',
      '-46 hours',
      '-44 hours',
      '-44 hours'
    );

    const t4Id = t4Res.lastInsertRowid;
    if (t4Id && hwEng) {
      db.prepare(`
        INSERT INTO ticket_resolution (ticket_id, engineer_id, resolution_notes, root_cause, time_spent_minutes, closed_at)
        VALUES (?, ?, ?, ?, ?, datetime('now', '-44 hours'))
      `).run(
        t4Id,
        hwEng.id,
        'Reseated DDR5 memory stick in slot 1 and performed RTC battery reset. System booted successfully to Windows 11.',
        'Oxidized memory contact pins causing memory POST failure.',
        45
      );
    }

    // Ticket 5: Reopened
    const t5Res = insertTicket.run(
      'TCK-2026-00005',
      clientUser.id,
      'Network Issue',
      'Network slow issue',
      'Internal ERP access is sluggish with 400ms latency on 1st Floor LAN port 12.',
      null,
      '+1-555-0101',
      '1st Floor',
      'Medium',
      'Reopened',
      netEng ? netEng.id : null,
      '-3 days',
      '-68 hours',
      '-50 hours',
      null
    );

    const t5Id = t5Res.lastInsertRowid;
    if (t5Id && clientUser && netEng) {
      db.prepare("INSERT INTO ticket_comments (ticket_id, user_id, message, created_at) VALUES (?, ?, ?, datetime('now', '-40 hours'))")
        .run(t5Id, clientUser.id, 'The latency spiked back up to 500ms after lunch today. Reopening this ticket.');
    }

    // Insert sample notifications
    if (adminUser) {
      db.prepare('INSERT INTO notifications (user_id, ticket_id, title, message, is_read) VALUES (?, ?, ?, ?, ?)')
        .run(adminUser.id, 1, 'New Ticket Created', 'Ticket TCK-2026-00001 (PC Issue) was raised by John Miller.', 0);
    }
    if (hwEng) {
      db.prepare('INSERT INTO notifications (user_id, ticket_id, title, message, is_read) VALUES (?, ?, ?, ?, ?)')
        .run(hwEng.id, 4, 'Ticket Resolved', 'You marked TCK-2026-00004 as Resolved.', 1);
    }
  }

  console.log('--- Database Seeded Successfully ---');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
