import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import TaskModal from '../components/TaskModal';
import CategoryModal from '../components/CategoryModal';
import './Dashboard.css';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_COLORS = { todo: 'var(--text3)', in_progress: 'var(--yellow)', done: 'var(--green)' };
const PRIORITY_COLORS = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--red)' };
const PRIORITY_BG = { low: 'var(--green-dim)', medium: 'var(--yellow-dim)', high: 'var(--red-dim)' };

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', category_id: '', search: '' });
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [catModal, setCatModal] = useState(null);   // null | 'new' | category object
  const [activeTab, setActiveTab] = useState('all');

  const fetchAll = useCallback(async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.category_id) params.category_id = filter.category_id;
      if (filter.search) params.search = filter.search;
      const [t, c] = await Promise.all([api.getTasks(params), api.getCategories()]);
      setTasks(t);
      setCategories(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleStatusChange = async (task, status) => {
    try {
      const updated = await api.updateTaskStatus(task.id, status);
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, ...updated } : t));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id);
      setTasks(ts => ts.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleDeleteCat = async (id) => {
    if (!confirm('Delete this category? Tasks will keep their data.')) return;
    try {
      await api.deleteCategory(id);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const filteredTasks = activeTab === 'all' ? tasks
    : tasks.filter(t => t.status === activeTab);

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className="dash">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ color: 'var(--accent)', fontSize: 22 }}>⬡</span>
          <span className="sidebar-logo-text">TaskFlow</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div>
            <div className="sidebar-username">{user?.username}</div>
            <div className="sidebar-email">{user?.email}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[['all','⊞','All Tasks'],['todo','○','To Do'],['in_progress','◑','In Progress'],['done','●','Done']].map(([key, icon, label]) => (
            <button
              key={key}
              className={`nav-item ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span className="nav-icon" style={{ color: key !== 'all' ? STATUS_COLORS[key] : undefined }}>{icon}</span>
              <span>{label}</span>
              <span className="nav-count">{counts[key]}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-section-title">
          Categories
          <button className="add-cat-btn" onClick={() => setCatModal('new')}>+</button>
        </div>
        <div className="categories-list">
          {categories.map(cat => (
            <div key={cat.id} className="cat-item">
              <span className="cat-dot" style={{ background: cat.color }} />
              <span className="cat-name">{cat.name}</span>
              <span className="cat-count">{cat.task_count}</span>
              <div className="cat-actions">
                <button onClick={() => setCatModal(cat)} title="Edit">✎</button>
                <button onClick={() => handleDeleteCat(cat.id)} title="Delete">✕</button>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-ghost logout-btn" onClick={logout}>
          ← Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="main-header">
          <div>
            <h1 className="main-title">
              {activeTab === 'all' ? 'All Tasks' : STATUS_LABELS[activeTab]}
            </h1>
            <p className="main-sub">{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setTaskModal('new')}>
            + New Task
          </button>
        </header>

        {/* Filters */}
        <div className="filters">
          <input
            type="text" placeholder="🔍  Search tasks…"
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            style={{ maxWidth: 260 }}
          />
          <select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={filter.category_id} onChange={e => setFilter(f => ({ ...f, category_id: e.target.value }))}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {(filter.search || filter.priority || filter.category_id) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilter({ status: '', priority: '', category_id: '', search: '' })}>
              Clear ✕
            </button>
          )}
        </div>

        {/* Tasks */}
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div>No tasks found</div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setTaskModal('new')}>
              Create your first task
            </button>
          </div>
        ) : (
          <div className="task-list fade-in">
            {filteredTasks.map(task => (
              <div key={task.id} className={`task-card ${task.status === 'done' ? 'done' : ''}`}>
                <div className="task-card-left">
                  <button
                    className={`task-check ${task.status === 'done' ? 'checked' : ''}`}
                    onClick={() => handleStatusChange(task, task.status === 'done' ? 'todo' : 'done')}
                    title="Toggle done"
                  >
                    {task.status === 'done' ? '✓' : ''}
                  </button>
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    {task.description && (
                      <div className="task-desc">{task.description}</div>
                    )}
                    <div className="task-meta">
                      {task.category_name && (
                        <span className="badge" style={{ background: task.category_color + '22', color: task.category_color, border: `1px solid ${task.category_color}44` }}>
                          {task.category_name}
                        </span>
                      )}
                      <span className="badge" style={{ background: PRIORITY_BG[task.priority], color: PRIORITY_COLORS[task.priority] }}>
                        {task.priority}
                      </span>
                      {task.due_date && (
                        <span className="task-due">
                          📅 {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="task-card-right">
                  <select
                    className="status-select"
                    value={task.status}
                    onChange={e => handleStatusChange(task, e.target.value)}
                    style={{ color: STATUS_COLORS[task.status] }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button className="task-action-btn" onClick={() => setTaskModal(task)} title="Edit">✎</button>
                  <button className="task-action-btn danger" onClick={() => handleDelete(task.id)} title="Delete">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {taskModal && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          categories={categories}
          onClose={() => setTaskModal(null)}
          onSave={() => { setTaskModal(null); fetchAll(); }}
        />
      )}
      {catModal && (
        <CategoryModal
          category={catModal === 'new' ? null : catModal}
          onClose={() => setCatModal(null)}
          onSave={() => { setCatModal(null); fetchAll(); }}
        />
      )}
    </div>
  );
}
