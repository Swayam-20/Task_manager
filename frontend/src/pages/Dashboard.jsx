import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, StatusBadge, ProgressBar, Alert } from '../components/UI';
import { formatDate, getApiError, isOverdue, pct, COLORS } from '../utils/helpers';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;
        tasksAPI.getDashboard()
            .then((res) => {
                if (active) setData(res.data);
            })
            .catch((err) => {
                if (active) {
                    setData(null);
                    setError(getApiError(err));
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    if (loading) return <Spinner />;
    if (!data) {
        return (
            <div className="card">
                <Alert message={error || 'Failed to load dashboard'} />
                <button className="btn" onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        );
    }

    const { stats, projects, recentTasks } = data;

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 500 }}>Good to see you, {user?.name?.split(' ')[0]} 👋</h2>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Here's what's happening with your team today.</p>
            </div>

            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-label">{isAdmin ? 'Total tasks' : 'My tasks'}</div>
                    <div className="stat-value">{stats.total}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">In progress</div>
                    <div className="stat-value" style={{ color: 'var(--info)' }}>{stats.in_progress}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Completed</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.done}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Overdue</div>
                    <div className="stat-value" style={{ color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text)' }}>{stats.overdue}</div>
                </div>
            </div>

            {projects.length > 0 && (
                <div className="mb-20">
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 10 }}>Projects overview</div>
                    <div className="proj-grid">
                        {projects.map((p, i) => {
                            const progress = pct(+p.done_tasks, +p.total_tasks);
                            return (
                                <div key={p.id} className="proj-card" onClick={() => navigate(`/projects/${p.id}`)}>
                                    <div className="flex items-center gap-8 mb-8">
                                        <div className="proj-dot" style={{ background: COLORS[i % COLORS.length] }} />
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                                    </div>
                                    <div className="flex justify-between mb-4" style={{ fontSize: 12, color: 'var(--text2)' }}>
                                        <span>{p.total_tasks} tasks</span>
                                        <span>{progress}% done</span>
                                    </div>
                                    <ProgressBar value={progress} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {recentTasks.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Recent tasks</div>
                        <button className="btn btn-sm" onClick={() => navigate('/tasks')}>View all</button>
                    </div>
                    {recentTasks.map(t => (
                        <div key={t.id} className="flex items-center gap-8 mb-8 p-4"
                            style={{ borderBottom: '0.5px solid var(--border)', paddingBottom: 8, cursor: 'pointer' }}
                            onClick={() => navigate('/tasks')}>
                            <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{t.project_name}</span>
                            <StatusBadge status={t.status} due={t.due_date} />
                            <span style={{ fontSize: 12, color: isOverdue(t.due_date, t.status) ? 'var(--danger)' : 'var(--text2)' }}>
                                {formatDate(t.due_date)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}