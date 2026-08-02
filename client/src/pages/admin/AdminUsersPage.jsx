import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Tag,
  Shield,
  Wrench,
  UserCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Building2,
  Phone,
  Mail,
  AlertCircle,
  Search,
  KeyRound,
  Check,
  X,
  AlertTriangle,
  Laptop,
  Monitor,
  Printer,
  Wifi
} from 'lucide-react';
import api from '../../api/client';
import Modal from '../../components/common/Modal';

const AVAILABLE_SKILLS = [
  { name: 'PC Issue', icon: Monitor, color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { name: 'Laptop Issue', icon: Laptop, color: 'border-purple-200 bg-purple-50 text-purple-700' },
  { name: 'Printer Issue', icon: Printer, color: 'border-amber-200 bg-amber-50 text-amber-700' },
  { name: 'Network Issue', icon: Wifi, color: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add User / Engineer Modal State
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Engineer@123');
  const [role, setRole] = useState('engineer');
  const [phone, setPhone] = useState('');
  const [floor, setFloor] = useState('');
  const [selectedSkills, setSelectedSkills] = useState(['PC Issue', 'Laptop Issue']);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit User / Engineer Modal State
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('engineer');
  const [editPhone, setEditPhone] = useState('');
  const [editFloor, setEditFloor] = useState('');
  const [editSkills, setEditSkills] = useState([]);
  const [editIsActive, setEditIsActive] = useState(1);
  const [editError, setEditError] = useState('');

  // Delete User Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, locsRes] = await Promise.all([
        api.get('/users'),
        api.get('/master/locations')
      ]);
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }
      if (locsRes.data.success) {
        setLocations(locsRes.data.locations);
        if (locsRes.data.locations.length > 0 && !floor) {
          setFloor(locsRes.data.locations[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = (defaultRole = 'engineer') => {
    setRole(defaultRole);
    setName('');
    setEmail('');
    setPhone('');
    setPassword(defaultRole === 'engineer' ? 'Engineer@123' : 'Welcome@123');
    setSelectedSkills(defaultRole === 'engineer' ? ['PC Issue', 'Laptop Issue'] : []);
    if (locations.length > 0) {
      setFloor(locations[0].name);
    }
    setFormError('');
    setAddUserOpen(true);
  };

  const handleToggleSkillAdd = (skillName) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const handleToggleSkillEdit = (skillName) => {
    if (editSkills.includes(skillName)) {
      setEditSkills(editSkills.filter((s) => s !== skillName));
    } else {
      setEditSkills([...editSkills, skillName]);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('Please fill in Name, Email, and Password.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.post('/users', {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        phone: phone.trim() || null,
        floor: floor || null,
        skills: role === 'engineer' ? selectedSkills : []
      });

      if (res.data.success) {
        setAddUserOpen(false);
        loadData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u) => {
    setEditingUserId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword('');
    setEditRole(u.role);
    setEditPhone(u.phone || '');
    setEditFloor(u.floor || (locations.length > 0 ? locations[0].name : ''));
    setEditSkills(u.skills || []);
    setEditIsActive(u.is_active);
    setEditError('');
    setEditUserOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Name and Email are required.');
      return;
    }

    try {
      setSubmitting(true);
      setEditError('');
      const payload = {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        phone: editPhone.trim() || null,
        floor: editFloor || null,
        is_active: editIsActive,
        skills: editRole === 'engineer' ? editSkills : []
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await api.put(`/users/${editingUserId}`, payload);
      if (res.data.success) {
        setEditUserOpen(false);
        loadData();
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (u) => {
    setUserToDelete(u);
    setDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/users/${userToDelete.id}`);
      if (res.data.success) {
        setDeleteModalOpen(false);
        setUserToDelete(null);
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user.id}/toggle-status`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchPhone = u.phone?.toLowerCase().includes(q);
      const matchSkills = u.skills?.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchPhone && !matchSkills) return false;
    }
    return true;
  });

  const engineerCount = users.filter((u) => u.role === 'engineer').length;
  const clientCount = users.filter((u) => u.role === 'client').length;
  const adminCount = users.filter((u) => u.role === 'super_admin').length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Staff & User Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, remove IT engineers and manage employee access roles & technical skill sets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddModal('engineer')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center gap-2 transition-all"
          >
            <Wrench className="w-4 h-4" />
            <span>Add IT Engineer</span>
          </button>
          <button
            onClick={() => openAddModal('client')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-300 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee / Admin</span>
          </button>
        </div>
      </div>

      {/* Role Tabs & Live Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All Accounts', count: users.length },
            { key: 'engineer', label: 'IT Engineers', count: engineerCount },
            { key: 'client', label: 'Clients / Employees', count: clientCount },
            { key: 'super_admin', label: 'Super Admins', count: adminCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                roleFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                  roleFilter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No accounts found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No matching users or engineers found. Try clearing your search query or add a new account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-3.5">User / Engineer</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Location / Floor</th>
                  <th className="px-6 py-3.5">Specialized Skills</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* User info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm ${
                            u.role === 'super_admin'
                              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                              : u.role === 'engineer'
                              ? 'bg-gradient-to-tr from-blue-600 to-cyan-600'
                              : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                          }`}
                        >
                          {u.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {u.name}
                          </div>
                          <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          {u.phone && (
                            <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border ${
                          u.role === 'super_admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'engineer'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {u.role === 'super_admin' && <Shield className="w-3 h-3" />}
                        {u.role === 'engineer' && <Wrench className="w-3 h-3" />}
                        {u.role === 'client' && <UserCheck className="w-3 h-3" />}
                        {u.role === 'super_admin' ? 'Super Admin' : u.role === 'engineer' ? 'IT Engineer' : 'Client / Employee'}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px]">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.floor || 'Unspecified'}</span>
                      </div>
                    </td>

                    {/* Skills */}
                    <td className="px-6 py-4">
                      {u.role === 'engineer' ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.skills && u.skills.length > 0 ? (
                            u.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">No skills tagged</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                          u.is_active === 1
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {u.is_active === 1 ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Engineer / User Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete / Remove Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ADD ENGINEER / USER MODAL                                      */}
      {/* ============================================================ */}
      <Modal
        isOpen={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        title={role === 'engineer' ? 'Add New IT Support Engineer' : 'Add New Account'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Account Role Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Role</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'engineer', label: 'IT Engineer', icon: Wrench },
                { key: 'client', label: 'Client / Employee', icon: UserCheck },
                { key: 'super_admin', label: 'Super Admin', icon: Shield }
              ].map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    type="button"
                    key={r.key}
                    onClick={() => {
                      setRole(r.key);
                      if (r.key === 'engineer') {
                        setPassword('Engineer@123');
                        if (selectedSkills.length === 0) setSelectedSkills(['PC Issue', 'Laptop Issue']);
                      } else {
                        setPassword('Welcome@123');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      role === r.key
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={role === 'engineer' ? 'e.g. Robert Lang' : 'e.g. Sarah Jenkins'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder={role === 'engineer' ? 'robert.lang@support.com' : 'employee@company.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone / Extension</label>
              <input
                type="text"
                placeholder="+1-555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Floor / Base Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Base Location / Floor</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Engineer Technical Skills Selector */}
          {role === 'engineer' && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Technical Specializations / Skills
              </label>
              <p className="text-[11px] text-slate-500 mb-2.5">
                The auto-triage and admin dispatch modal match tickets to engineers tagged with these skills.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_SKILLS.map((item) => {
                  const Icon = item.icon;
                  const isChecked = selectedSkills.includes(item.name);
                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => handleToggleSkillAdd(item.name)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-indigo-600" />
                        <span>{item.name}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddUserOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50 transition-all"
            >
              {submitting ? 'Creating Account...' : role === 'engineer' ? 'Create IT Engineer' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* EDIT ENGINEER / USER MODAL                                     */}
      {/* ============================================================ */}
      <Modal
        isOpen={editUserOpen}
        onClose={() => setEditUserOpen(false)}
        title={editRole === 'engineer' ? 'Edit IT Engineer Profile' : 'Edit User Profile'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Edit Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Edit Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Edit Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone / Extension</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Edit Floor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Base Location / Floor</label>
              <select
                value={editFloor}
                onChange={(e) => setEditFloor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Change Password (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reset Password <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>
              </label>
              <input
                type="text"
                placeholder="Enter new password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Account Status Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Active Status</label>
              <select
                value={editIsActive}
                onChange={(e) => setEditIsActive(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive / Suspended</option>
              </select>
            </div>
          </div>

          {/* Engineer Skills in Edit */}
          {editRole === 'engineer' && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Technical Specializations / Skills
              </label>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Update the engineer's domain tagging for automatic ticket dispatching.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_SKILLS.map((item) => {
                  const Icon = item.icon;
                  const isChecked = editSkills.includes(item.name);
                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => handleToggleSkillEdit(item.name)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-indigo-600" />
                        <span>{item.name}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditUserOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50 transition-all"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL                                     */}
      {/* ============================================================ */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Account Removal"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 space-y-1">
              <p className="font-bold">
                Are you sure you want to remove {userToDelete?.role === 'engineer' ? 'IT Engineer' : 'User'}{' '}
                "{userToDelete?.name}"?
              </p>
              <p className="text-[11px] text-rose-700">
                This action is permanent. If this engineer currently has active assigned tickets, those tickets will automatically be reset to Open status for re-triage.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteUser}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Removing...' : 'Confirm Remove'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
