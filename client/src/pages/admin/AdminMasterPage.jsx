import React, { useState, useEffect } from 'react';
import {
  Building2,
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';
import Modal from '../../components/common/Modal';

export default function AdminMasterPage() {
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Location Modal
  const [newLocOpen, setNewLocOpen] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [buildingName, setBuildingName] = useState('Main Tower');
  const [submittingLoc, setSubmittingLoc] = useState(false);

  // New Sub-Option Modal
  const [newSubOpen, setNewSubOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [subOptionName, setSubOptionName] = useState('');
  const [submittingSub, setSubmittingSub] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locRes, catRes] = await Promise.all([
        api.get('/master/locations'),
        api.get('/master/categories')
      ]);
      if (locRes.data.success) setLocations(locRes.data.locations);
      if (catRes.data.success) {
        setCategories(catRes.data.categories);
        if (catRes.data.categories.length > 0) {
          setSelectedCatId(String(catRes.data.categories[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load master lookup data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    if (!locationName.trim()) return;

    try {
      setSubmittingLoc(true);
      const res = await api.post('/master/locations', {
        name: locationName.trim(),
        building: buildingName.trim()
      });
      if (res.data.success) {
        setNewLocOpen(false);
        setLocationName('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to create location:', err);
    } finally {
      setSubmittingLoc(false);
    }
  };

  const handleCreateSubOption = async (e) => {
    e.preventDefault();
    if (!subOptionName.trim() || !selectedCatId) return;

    try {
      setSubmittingSub(true);
      const res = await api.post('/master/categories/sub-options', {
        category_id: parseInt(selectedCatId, 10),
        name: subOptionName.trim()
      });
      if (res.data.success) {
        setNewSubOpen(false);
        setSubOptionName('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to create sub option:', err);
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this location?')) return;
    try {
      await api.delete(`/master/locations/${id}`);
      loadData();
    } catch (err) {
      console.error('Failed to delete location:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Master Data & Lookups Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic physical floors, categories, and symptom options for the ticket wizard.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical Floors & Locations */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Floors & Campus Locations</span>
              </h2>
              <p className="text-xs text-slate-400">Used in Step 5 of ticket creation</p>
            </div>
            <button
              onClick={() => setNewLocOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Floor</span>
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{loc.name}</span>
                  <span className="text-[11px] text-slate-400 block">{loc.building}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      loc.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {loc.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories & Sub-Options */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Categories & Dynamic Sub-Options</span>
              </h2>
              <p className="text-xs text-slate-400">Used in Steps 1 & 2 of ticket creation</p>
            </div>
            <button
              onClick={() => setNewSubOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sub-Option</span>
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs">{cat.name}</h3>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    {cat.subOptions?.length || 0} sub-options
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cat.subOptions?.map((sub, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      <Modal
        isOpen={newLocOpen}
        onClose={() => setNewLocOpen(false)}
        title="Add New Floor / Location"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateLocation} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Floor / Location Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. 5th Floor - R&D Wing"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Building / Complex
            </label>
            <input
              type="text"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="e.g. Main Tower"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNewLocOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingLoc}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
            >
              Save Floor
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Sub-Option Modal */}
      <Modal
        isOpen={newSubOpen}
        onClose={() => setNewSubOpen(false)}
        title="Add Symptom / Sub-Option"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSubOption} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Parent Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sub-Option Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subOptionName}
              onChange={(e) => setSubOptionName(e.target.value)}
              placeholder="e.g. VPN Access Denied, Screen Flickering"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNewSubOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingSub}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
            >
              Add Sub-Option
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
