import { useState } from 'react';
import { api } from '../api/client';
import './Modal.css';

export default function TaskModal({ task, categories, onClose, onSave }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    category_id: task?.category_id || '',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    try {
      const body = { ...form, category_id: form.category_id || null, due_date: form.due_date || null };
      if (isEdit) {
        await api.updateTask(task.id, body);
      } else {
        await api.createTask(body);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={submit} className="modal-form">
          <div className="field">
            <label>Title *</label>
            <input name="title" value={form.title} onChange={handle} placeholder="Task title" autoFocus required />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handle}
              placeholder="Optional description…" rows={3} style={{ resize: 'vertical' }} />
          </div>

          <div className="modal-row">
            <div className="field">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handle}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handle}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="modal-row">
            <div className="field">
              <label>Category</label>
              <select name="category_id" value={form.category_id} onChange={handle}>
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Due date</label>
              <input type="date" name="due_date" value={form.due_date} onChange={handle} />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
