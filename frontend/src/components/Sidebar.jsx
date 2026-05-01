import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COLORS, BG_COLORS } from '../utils/helpers';

const NavIcon = ({ path }) => {
    const icons = {
        dashboard: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" /><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8" /><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4" /><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4" /></svg>,
        projects: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
        tasks: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 8h10M3 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="13" cy="12" r="2.5" fill="currentColor" opacity="0.7" /></svg>,
        team: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" fill="currentColor" opacity="0.8" /><circle cx="11" cy="5" r="2" fill="currentColor" opacity="0.4" /><path d="M1 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M12 10c1.657 0 3 1.343 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    };
    return icons[path] || null;
};

export default function Sidebar({ projects = [] }) {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const PROJ_COLORS = ['#534AB7', '#0F6E56', '#993C1D', '#993556', '#185FA5'];

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">TM</div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>TaskFlow</span>
            </div>

            <div className="sidebar-nav">
                {[
                    { to: '/dashboard', label: 'Dashboard', key: 'dashboard' },
                    { to: '/projects', label: 'Projects', key: 'projects' },
                    { to: '/tasks', label: 'My Tasks', key: 'tasks' },
                    { to: '/team', label: 'Team', key: 'team' },
                ].map(({ to, label, key }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    >
                        <NavIcon path={key} />
                        {label}
                        {key === 'team' && isAdmin && <span className="nav-badge">Admin</span>}
                    </NavLink>
                ))}

                <div className="nav-section">Projects</div>
                {projects.map((p, i) => (
                    <div
                        key={p.id}
                        className="nav-item"
                        onClick={() => navigate(`/projects/${p.id}`)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="proj-dot" style={{ background: PROJ_COLORS[i % PROJ_COLORS.length] }} />
                        <span className="truncate flex-1">{p.name}</span>
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="user-card" onClick={logout} title="Click to logout">
                    <div
                        className="avatar"
                        style={{
                            background: BG_COLORS[user?.id % BG_COLORS.length],
                            color: COLORS[user?.id % COLORS.length],
                            width: 30, height: 30, fontSize: 12,
                        }}
                    >
                        {user?.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="user-name">{user?.name}</div>
                        <div className="user-role">{isAdmin ? 'Administrator' : 'Member'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}