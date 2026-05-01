import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/UI';
import { getApiError } from '../utils/helpers';

export default function Signup() {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signup(form);
            navigate('/dashboard');
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="logo-icon">TM</div>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>TaskFlow</span>
                </div>
                <div className="auth-title">Create your account</div>
                <div className="auth-sub">Join your team on TaskFlow</div>

                <Alert message={error} />

                <form onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Full name</label>
                        <input className="form-input" placeholder="Alex Carter"
                            value={form.name} onChange={e => set('name', e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" placeholder="you@company.com"
                            value={form.email} onChange={e => set('email', e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" placeholder="Min. 6 characters"
                            value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['member', 'admin'].map(r => (
                                <div key={r}
                                    onClick={() => set('role', r)}
                                    style={{
                                        flex: 1, padding: '8px', border: `0.5px solid ${form.role === r ? 'var(--accent)' : 'var(--border2)'}`,
                                        borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'center', fontSize: 13,
                                        background: form.role === r ? 'var(--accent-light)' : 'var(--surface)',
                                        color: form.role === r ? 'var(--accent)' : 'var(--text)',
                                        fontWeight: form.role === r ? 500 : 400,
                                    }}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading}
                        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
}