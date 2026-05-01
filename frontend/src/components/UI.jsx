import { COLORS, BG_COLORS, statusLabel, isOverdue, formatDate } from '../utils/helpers';

// ── Avatar
export const Avatar = ({ user, size = 'md' }) => {
    const cls = size === 'sm' ? 'avatar-sm' : 'avatar';
    const color = COLORS[user?.id % COLORS.length] || '#534AB7';
    const bg = BG_COLORS[user?.id % BG_COLORS.length] || '#EEEDFE';
    return (
        <div className={cls} style={{ background: bg, color }}>
            {user?.avatar || '?'}
        </div>
    );
};

// ── Status Badge
export const StatusBadge = ({ status, due }) => {
    if (isOverdue(due, status)) return <span className="badge badge-overdue">Overdue</span>;
    return <span className={`badge badge-${status}`}>{statusLabel[status] || status}</span>;
};

// ── Priority Badge
export const PriorityBadge = ({ priority }) => (
    <span className={`badge badge-${priority}`}>{priority}</span>
);

// ── Progress Bar
export const ProgressBar = ({ value }) => (
    <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
);


export const Modal = ({ title, onClose, children, actions }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{title}</div>
            {children}
            {actions && <div className="modal-actions">{actions}</div>}
        </div>
    </div>
);

// ── Alert
export const Alert = ({ type = 'error', message }) =>
    message ? <div className={`alert alert-${type}`}>{message}</div> : null;

// ── Spinner
export const Spinner = ({ full }) =>
    full ? (
        <div className="loading-screen"><div className="spinner" /></div>
    ) : (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div className="spinner" />
        </div>
    );

// ── Task Row (shared between views)
export const TaskRow = ({ task, onClick, onDelete, isAdmin }) => (
    <tr onClick={() => onClick(task)}>
        <td><span className="font-500">{task.title}</span></td>
        <td><span style={{ fontSize: 12, color: 'var(--text2)' }}>{task.project_name}</span></td>
        <td><StatusBadge status={task.status} due={task.due_date} /></td>
        <td><PriorityBadge priority={task.priority} /></td>
        <td>
            <div className="flex items-center gap-6">
                {task.assignee_avatar && (
                    <div className="avatar-sm" style={{ background: BG_COLORS[task.assignee_id % BG_COLORS.length], color: COLORS[task.assignee_id % COLORS.length] }}>
                        {task.assignee_avatar}
                    </div>
                )}
                <span className="text-sm text-muted">{task.assignee_name || '—'}</span>
            </div>
        </td>
        <td><span className="text-sm" style={{ color: isOverdue(task.due_date, task.status) ? 'var(--danger)' : 'var(--text2)' }}>{formatDate(task.due_date)}</span></td>
        {isAdmin && (
            <td onClick={e => e.stopPropagation()}>
                <button className="btn btn-sm btn-danger" onClick={() => onDelete(task.id)}>Delete</button>
            </td>
        )}
    </tr>
);