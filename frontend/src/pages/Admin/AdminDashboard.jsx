import { useState, useEffect } from 'react';
import { Shield, Users, UserCheck, Settings, Trash2, Edit3, UserPlus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import api from '../../services/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for creating/editing users
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [firebaseUid, setFirebaseUid] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('FARMER');
  const [status, setStatus] = useState('ACTIVE');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.detail || 'Failed to fetch registered database users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!firebaseUid || !fullName || !email) {
      setError('Firebase UID, Full Name, and Email are required.');
      return;
    }

    try {
      const newUser = {
        firebase_uid: firebaseUid,
        full_name: fullName,
        email,
        role,
        status
      };
      await api.post('/users', newUser);
      setSuccess('User registered successfully in local database.');
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updatedData = {
        full_name: fullName,
        email,
        role,
        status
      };
      await api.put(`/users/${editingUser.id}`, updatedData);
      setSuccess('User profile updated successfully.');
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user.');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user from MySQL? This action is irreversible.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.delete(`/users/${userId}`);
      setSuccess('User deleted successfully.');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFirebaseUid(user.firebase_uid);
    setFullName(user.full_name);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingUser(null);
    setFirebaseUid('');
    setFullName('');
    setEmail('');
    setRole('FARMER');
    setStatus('ACTIVE');
  };

  const getRoleBadge = (r) => {
    if (r === 'ADMIN') return <Badge variant="success">Admin</Badge>;
    if (r === 'INSPECTOR') return <Badge variant="warning">Inspector</Badge>;
    return <Badge variant="primary">Farmer</Badge>;
  };

  const getStatusBadge = (s) => {
    if (s === 'ACTIVE') return <Badge variant="success">Active</Badge>;
    return <Badge variant="danger">Inactive</Badge>;
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-400 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
            System Administration Cockpit
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage user permissions, configure inspector credentials, audit activity statuses, and tweak global platform settings.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
          <Shield className="text-emerald-500 dark:text-emerald-400" size={18} />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Admin Clearance Level 3
          </span>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Total Users</span>
            <Users size={18} className="text-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">{users.length}</p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Farmers</span>
            <Badge variant="primary">FARMER</Badge>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">
            {users.filter(u => u.role === 'FARMER').length}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Inspectors</span>
            <Badge variant="warning">INSPECTOR</Badge>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">
            {users.filter(u => u.role === 'INSPECTOR').length}
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Active Sessions</span>
            <UserCheck size={18} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white mt-2">
            {users.filter(u => u.status === 'ACTIVE').length}
          </p>
        </Card>
      </div>

      {/* Notifications Alert banner */}
      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users Table List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users size={18} className="text-slate-400" />
                User Profiles (MySQL Database)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchUsers}
                  className="p-2 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition"
                  title="Refresh profiles"
                >
                  <RefreshCw size={15} />
                </button>
                <Button
                  variant="primary"
                  onClick={() => {
                    resetForm();
                    setShowAddForm(true);
                  }}
                  className="flex items-center gap-1.5 py-1.5 px-3 text-xs"
                >
                  <UserPlus size={14} /> Add User
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading database entries...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/5 text-slate-400 uppercase font-bold tracking-wider">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {users.map((u) => (
                      <tr key={u.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-white/5 transition">
                        <td className="py-3.5 font-bold text-slate-800 dark:text-slate-250">{u.full_name}</td>
                        <td className="py-3.5">{u.email}</td>
                        <td className="py-3.5">{getRoleBadge(u.role)}</td>
                        <td className="py-3.5">{getStatusBadge(u.status)}</td>
                        <td className="py-3.5 text-right flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-emerald-500 transition"
                            title="Edit user details"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition"
                            title="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Add/Edit User Sidebar Form */}
        <div className="lg:col-span-1">
          {showAddForm ? (
            <Card className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/5 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200">
                  {editingUser ? 'Edit User Profile' : 'Pre-Register User'}
                </h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs">
                  Cancel
                </button>
              </div>

              <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
                {!editingUser && (
                  <Input
                    id="firebaseUid"
                    type="text"
                    label="Firebase Unique ID (UID)"
                    placeholder="AIzaSyC1..."
                    value={firebaseUid}
                    onChange={(e) => setFirebaseUid(e.target.value)}
                    required
                  />
                )}
                
                <Input
                  id="fullName"
                  type="text"
                  label="Full Name"
                  placeholder="Vipin Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <Input
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="vipin@research.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">User Authorization Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  >
                    <option value="FARMER">FARMER (Scholar/Applicant)</option>
                    <option value="INSPECTOR">INSPECTOR (Underwriter/Adjuster)</option>
                    <option value="ADMIN">ADMIN (System Administrator)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">User Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  >
                    <option value="ACTIVE">ACTIVE (Full Clearances)</option>
                    <option value="INACTIVE">INACTIVE (Deactivated/Access Blocked)</option>
                  </select>
                </div>

                <Button type="submit" variant="primary" className="w-full py-2.5 text-xs">
                  {editingUser ? 'Save Profile' : 'Create User'}
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 p-8 text-center text-slate-400 dark:text-slate-500">
              <Settings size={24} className="mx-auto mb-3 opacity-60" />
              <p className="text-xs">Click "Add User" or select edit action on any existing profile record to modify settings.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
