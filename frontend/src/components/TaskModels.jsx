import { useState } from 'react';
import { Modal, Alert, StatusBadge, PriorityBadge } from './UI';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue, getApiError } from '../utils/helpers';

export function TaskFormModal({ projects, users, defaultProjectId, onClose, onCreated }) {
    const [form, setForm] = useState({
        title: '', description: '', project_id: defaultProjectId || '',
        assignee_id: '', status: 'todo', priority: 'medium', due_date: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async () => {
        if (!form.title.trim() || !form.project_id) {
            setError('Title and project are required');
            return;
        }
        setLoading(true);
        try {
            const res = await tasksAPI.create({
                ...form,
                project_id: +form.project_id,
                assignee_id: form.assignee_id ? +form.assignee_id : undefined,
            });
            onCreated(res.data.task);
        } catch (err) {
            setError(getApiError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="New Task" onClose={onClose} actions={
            <>
                <button className="btn" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={submit} disabled={loading}>
                    {loading ? 'Creating...' : 'Create task'}
                </button>
            </>
        }>
            <Alert message={error} />
            <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Task title" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Brief description..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="grid-2">
                <div className="form-group">
                    <label className="form-label">Project *</label>
                    <select className="form-select" value={form.project_id} onChange={e => set('project_id', e.target.value)}>
                        <option value="">Select project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select className="form-select" value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                        <option value="">Unassigned</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                        <option value="todo">To do</option>
                        <option value="inprogress">In progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Due date</label>
                    <input className="form-input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
                </div>
            </div>
        </Modal>
    );
}

export function TaskDetailModal({ task: initialTask, onClose, onUpdated, onDeleted, isAdmin }) {
    const [task, setTask] = useState(initialTask);
    const [status, setStatus] = useState(task.status);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const canEdit = isAdmin || task.assignee_id === user?.id;

    const updateStatus = async (newStatus) => {
        setStatus(newStatus);
        setLoading(true);
        try {
            const res = await tasksAPI.update(task.id, { status: newStatus });
            setTask(res.data.task);
            onUpdated(res.data.task);
        } finally {
            setLoading(false);
        }
    };

    const over = isOverdue(task.due_date, task.status);

    return (
        <Modal title={task.title} onClose={onClose} actions={
            <>
                {isAdmin && (
                    <button className="btn btn-danger btn-sm" onClick={() => { onDeleted(task.id); onClose(); }}>
                        Delete
                    </button>
                )}
                <button className="btn" onClick={onClose}>Close</button>
            </>
        }>
            <div className="flex gap-8 mb-12" style={{ flexWrap: 'wrap' }}>
                <StatusBadge status={task.status} due={task.due_date} />
                <PriorityBadge priority={task.priority} />
                <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>{task.project_name}</span>
                {over && <span className="badge badge-overdue">Overdue</span>}
            </div>

            {task.description && (
                <div className="form-group">
                    <div className="form-label">Description</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{task.description}</div>
                </div>
            )}

            <div className="grid-2 mb-12">
                <div>
                    <div className="form-label">Assignee</div>
                    <div style={{ fontSize: 13 }}>{task.assignee_name || 'Unassigned'}</div>
                </div>
                <div>
                    <div className="form-label">Due date</div>
                    <div style={{ fontSize: 13, color: over ? 'var(--danger)' : 'var(--text)' }}>{formatDate(task.due_date)}</div>
                </div>
            </div>

            {canEdit && (
                <div className="form-group">
                    <label className="form-label">Update status</label>
                    <select className="form-select" value={status} onChange={e => updateStatus(e.target.value)} disabled={loading}>
                        <option value="todo">To do</option>
                        <option value="inprogress">In progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>
            )}

            {!canEdit && (
                <div className="alert alert-info">You have view-only access to this task.</div>
            )}
        </Modal>
    );
}