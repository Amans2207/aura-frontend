import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, User, Star, LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000';

interface AppUser {
  id: number;
  supabase_uid: string;
  name: string;
  email: string;
  is_admin: boolean;
  is_pro: boolean;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) {
        if (res.status === 403) throw new Error('Access denied. Admin only.');
        throw new Error('Failed to fetch users');
      }

      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePro = async (userId: number, currentStatus: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_BASE}/admin/users/${userId}/pro`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_pro: !currentStatus })
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, is_pro: !currentStatus } : u));
      } else {
        alert('Failed to update pro status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader2 className="animate-spin" /></div>;

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <Shield size={48} color="var(--accent-primary)" style={{ marginBottom: 20 }} />
      <h2>Admin Access Required</h2>
      <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      <button className="primary-btn" onClick={() => navigate('/')} style={{ marginTop: 20 }}>Go Home</button>
    </div>
  );

  return (
    <div style={{ padding: '40px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Shield size={32} color="var(--accent-secondary)" />
          <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        </div>
        <button className="control-btn" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 24, borderRadius: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: '1.2rem' }}>User Management</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>User</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Email</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Role</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={18} />
                    </div>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                  </div>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{user.email}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {user.is_admin && <span style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>Admin</span>}
                    {user.is_pro ? (
                      <span style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899', padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Star size={12} /> Pro</span>
                    ) : (
                      <span style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>Free</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  {!user.is_admin && (
                    <button 
                      onClick={() => togglePro(user.id, user.is_pro)}
                      style={{ 
                        background: user.is_pro ? 'transparent' : 'var(--accent-gradient)', 
                        color: user.is_pro ? 'var(--text-primary)' : 'white', 
                        border: user.is_pro ? '1px solid var(--border-color)' : 'none',
                        padding: '6px 16px', 
                        borderRadius: 16, 
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      {user.is_pro ? 'Revoke Pro' : 'Grant Pro'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary)' }}>No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
