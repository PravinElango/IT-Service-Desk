const db = require('../config/db');

function getLocations(req, res) {
  try {
    const locations = db.prepare('SELECT id, name, is_active FROM locations ORDER BY name ASC').all();
    return res.json({ success: true, locations });
  } catch (err) {
    console.error('getLocations error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve locations: ' + err.message });
  }
}

function createLocation(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Location/Floor name is required.' });
    }

    const existing = db.prepare('SELECT id FROM locations WHERE name = ? COLLATE NOCASE').get(name.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Location already exists.' });
    }

    const result = db.prepare('INSERT INTO locations (name, is_active) VALUES (?, 1)').run(name.trim());
    const newLocation = db.prepare('SELECT * FROM locations WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({ success: true, message: 'Location added successfully', location: newLocation });
  } catch (err) {
    console.error('createLocation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add location: ' + err.message });
  }
}

function updateLocation(req, res) {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const loc = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
    if (!loc) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const updatedName = name ? name.trim() : loc.name;
    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : loc.is_active;

    db.prepare('UPDATE locations SET name = ?, is_active = ? WHERE id = ?').run(updatedName, updatedActive, id);
    const updated = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);

    return res.json({ success: true, message: 'Location updated successfully', location: updated });
  } catch (err) {
    console.error('updateLocation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update location: ' + err.message });
  }
}

function deleteLocation(req, res) {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM locations WHERE id = ?').run(id);
    return res.json({ success: true, message: 'Location removed successfully' });
  } catch (err) {
    console.error('deleteLocation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete location: ' + err.message });
  }
}

function getCategoriesAndSubOptions(req, res) {
  try {
    const categories = db.prepare('SELECT id, name, description, icon, is_active FROM categories WHERE is_active = 1 ORDER BY id ASC').all();
    const subStmt = db.prepare('SELECT id, category_name, name, is_active FROM sub_options WHERE is_active = 1 ORDER BY id ASC');

    const result = categories.map(cat => {
      const subOptions = subStmt.all().filter(s => s.category_name === cat.name).map(s => s.name);
      return {
        ...cat,
        subOptions
      };
    });

    return res.json({ success: true, categories: result });
  } catch (err) {
    console.error('getCategoriesAndSubOptions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve categories: ' + err.message });
  }
}

function createCategory(req, res) {
  try {
    const { name, description, icon, subOptions } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE').get(name.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category already exists.' });
    }

    const result = db.prepare('INSERT INTO categories (name, description, icon, is_active) VALUES (?, ?, ?, 1)')
      .run(name.trim(), description || '', icon || 'HelpCircle');

    if (Array.isArray(subOptions)) {
      const insertSub = db.prepare('INSERT INTO sub_options (category_name, name) VALUES (?, ?)');
      for (const sub of subOptions) {
        if (sub && sub.trim()) {
          insertSub.run(name.trim(), sub.trim());
        }
      }
    }

    return res.status(201).json({ success: true, message: 'Category created successfully' });
  } catch (err) {
    console.error('createCategory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create category: ' + err.message });
  }
}

function addSubOption(req, res) {
  try {
    const { category_name, name } = req.body;
    if (!category_name || !name) {
      return res.status(400).json({ success: false, message: 'Category name and sub-option name are required.' });
    }

    db.prepare('INSERT INTO sub_options (category_name, name) VALUES (?, ?)').run(category_name.trim(), name.trim());
    return res.status(201).json({ success: true, message: 'Sub-option added successfully' });
  } catch (err) {
    console.error('addSubOption error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add sub-option: ' + err.message });
  }
}

module.exports = {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getCategoriesAndSubOptions,
  createCategory,
  addSubOption
};
