import { useState } from 'react';
import { api } from '../api/client';
import './Modal.css';

const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f43f5e',
  '#f97316','#eab308','#22c55e','#14b8a6',
  '#3b82f6','#06b6d4','#a78bfa','#fb7185',
];

export default function CategoryModal({ category, onClose, onSave }) {
  const isEdit = !!category;
  const [form, setForm] = useState({
    name: category?.name || '',
    color: category?.color || '#6366f1',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await api.updateCategory(category.id, form);
      } else {
        await api.createCategory(form);
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
      <div className="modal modal-sm fade-in">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Category' : 'New Category'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={submit} className="modal-form">
          <div className="field">
            <label>Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Category name"
              autoFocus required
            />
          </div>

          <div className="field">
            <label>Color</label>
            <div className="color-grid">
              {PRESET_COLORS.map(c => (
                <button
                  type="button" key={c}
                  className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
