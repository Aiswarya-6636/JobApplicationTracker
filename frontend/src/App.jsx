
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/applications";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const emptyForm = {
  companyName: "",
  jobRole: "",
  jobType: "Full-time",
  appliedDate: today(),
  salary: "",
  notes: ""
};

const nextStatuses = {
  Applied: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Accepted", "Declined"],
  Rejected: [],
  Accepted: [],
  Declined: []
};

function App() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadApplications() {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("company", search.trim());
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`${API}?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Could not load applications");

      setApplications(result.data || []);

      const statsResponse = await fetch(`${API}/stats`);
      const statsResult = await statsResponse.json();
      const counts = {};
      (statsResult.data || []).forEach(item => {
        counts[item._id] = item.count;
      });
      setStats(counts);
    } catch (error) {
      setMessage("Could not connect to the backend. Make sure it is running on port 5000.");
    }
  }

  useEffect(() => {
    loadApplications();
  }, [search, statusFilter]);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const url = editingId ? `${API}/${editingId}` : API;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary: form.salary === "" ? null : Number(form.salary)
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to save application");

      setMessage(result.message);
      setForm(emptyForm);
      setEditingId(null);
      await loadApplications();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(application) {
    setEditingId(application._id);
    setForm({
      companyName: application.companyName,
      jobRole: application.jobRole,
      jobType: application.jobType,
      appliedDate: today(),
      salary: application.salary ?? "",
      notes: application.notes || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function changeStatus(id, status) {
    try {
      const response = await fetch(`${API}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Status update failed");

      setMessage(result.message);
      await loadApplications();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteApplication(application) {
    if (!window.confirm(`Delete the application for ${application.companyName}?`)) return;

    try {
      const response = await fetch(`${API}/${application._id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Delete failed");

      setMessage(result.message);
      await loadApplications();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const overdueCount = applications.filter(app =>
    app.isOverdue ?? (
      app.status === "Applied" && new Date() > new Date(app.followUpDate)
    )
  ).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">JT</div>
        <div>
          <h1>JobTrack</h1>
          <p>Job Application Tracker</p>
        </div>
        <span className="live-tag">● Personal Dashboard</span>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">YOUR CAREER, ORGANIZED</p>
          <h2>Keep every opportunity in view.</h2>
          <p className="welcome-text">
            Track applications, follow up on time, and keep your job search moving.
          </p>
        </div>
        <div className="welcome-icon">✦</div>
      </section>

      {message && (
        <div className="message" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage("")} aria-label="Dismiss message">×</button>
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">▤</span>
          <p>Total applications</p>
          <strong>{total}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon purple">◷</span>
          <p>Applied</p>
          <strong>{stats.Applied || 0}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon orange">↗</span>
          <p>Interviews</p>
          <strong>{stats.Interview || 0}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-icon red">!</span>
          <p>Overdue follow-ups</p>
          <strong>{overdueCount}</strong>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel form-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">APPLICATION DETAILS</p>
              <h2>{editingId ? "Edit application" : "Add an application"}</h2>
            </div>
            <span className="heading-icon">＋</span>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Company name *
              <input
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g. Google"
                required
              />
            </label>

            <label>
              Job role *
              <input
                name="jobRole"
                value={form.jobRole}
                onChange={handleChange}
                placeholder="e.g. Software Developer"
                required
              />
            </label>

            <div className="form-row">
              <label>
                Job type *
                <select name="jobType" value={form.jobType} onChange={handleChange}>
                  <option>Full-time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                </select>
              </label>
              <label>
                Applied date *
                <input
                  type="date"
                  name="appliedDate"
                  value={form.appliedDate}
                  max={today()}
                  onChange={handleChange}
                  required
                  disabled={Boolean(editingId)}
                />
              </label>
            </div>

            <label>
              Salary (optional)
              <input
                type="number"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                placeholder="Expected annual salary"
                min="0"
              />
            </label>

            <label>
              Notes (optional)
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Recruiter details, interview preparation..."
                rows="3"
              />
            </label>

            <button className="primary-button" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Save changes" : "＋ Add application"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel editing
              </button>
            )}
          </form>
        </div>

        <div className="panel list-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR JOB SEARCH</p>
              <h2>Applications <span className="count">{applications.length}</span></h2>
            </div>
          </div>

          <div className="filters">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="⌕  Search company..."
              aria-label="Search company"
            />
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {Object.keys(nextStatuses).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <h3>No applications found</h3>
              <p>Add your first job application using the form.</p>
            </div>
          ) : (
            <div className="application-list">
              {applications.map(application => {
                const canDelete = [
                  "Applied", "Rejected", "Accepted", "Declined"
                ].includes(application.status);

                return (
                  <article className="application-card" key={application._id}>
                    <div className="application-top">
                      <div className="company-avatar">
                        {(application.companyName || "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="application-title">
                        <h3>{application.companyName}</h3>
                        <p>{application.jobRole}</p>
                      </div>
                      <span className={`status-badge status-${application.status.toLowerCase()}`}>
                        {application.status}
                      </span>
                    </div>

                    <div className="application-meta">
                      <span>▣ {new Date(application.appliedDate).toLocaleDateString()}</span>
                      <span>◈ {application.jobType}</span>
                      <span>ID: {application.applicationId}</span>
                    </div>

                    {application.isOverdue && application.status === "Applied" && (
                      <p className="overdue-badge">⚠ Follow-up overdue</p>
                    )}

                    {application.followUpDate && (
                      <p className="followup-text">
                        Follow up by {new Date(application.followUpDate).toLocaleDateString()}
                      </p>
                    )}

                    {application.notes && <p className="notes-text">{application.notes}</p>}

                    <div className="card-actions">
                      {nextStatuses[application.status]?.length > 0 && (
                        <select
                          defaultValue=""
                          onChange={event => {
                            if (event.target.value) {
                              changeStatus(application._id, event.target.value);
                              event.target.value = "";
                            }
                          }}
                          aria-label={`Change status for ${application.companyName}`}
                        >
                          <option value="" disabled>Update status</option>
                          {nextStatuses[application.status].map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      )}
                      <button className="edit-button" onClick={() => startEdit(application)}>
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        disabled={!canDelete}
                        title={canDelete ? "Delete application" : "Interview and Offer applications cannot be deleted"}
                        onClick={() => deleteApplication(application)}
                      >
                        Delete
                      </button>
                    </div>

                    {application.statusHistory?.length > 0 && (
                      <details className="history">
                        <summary>View status history</summary>
                        <ul>
                          {application.statusHistory.map((item, index) => (
                            <li key={`${item.status}-${index}`}>
                              <strong>{item.status}</strong>
                              <span>{new Date(item.changedAt).toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer>JobTrack · Stay organized. Take the next step.</footer>
    </main>
  );
}

export default App;
