export const COLORS = ['#534AB7', '#0F6E56', '#993C1D', '#993556', '#185FA5', '#639922', '#BA7517'];
export const BG_COLORS = ['#EEEDFE', '#E1F5EE', '#FAECE7', '#FBEAF0', '#E6F1FB', '#EAF3DE', '#FAEEDA'];

export const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const isOverdue = (due, status) => {
    if (!due || status === 'done') return false;
    return new Date(due) < new Date(new Date().toDateString());
};

export const statusLabel = { todo: 'To do', inprogress: 'In progress', done: 'Done' };
export const priorityColor = { high: '#A32D2D', medium: '#BA7517', low: '#3B6D11' };

export const getApiError = (err) => {
    if (err.response?.data?.errors) {
        return err.response.data.errors.map(e => e.message).join(', ');
    }
    return err.response?.data?.error || err.message || 'Something went wrong';
};

export const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0);