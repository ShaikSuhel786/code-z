import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// --- SHARED UI ---
const ProgressBar = ({ value, colorMap }) => {
  let color = 'var(--primary)';
  if (colorMap) {
    if (value > 60) color = 'var(--danger)';
    else if (value > 30) color = 'var(--warning)';
    else color = 'var(--secondary)';
  }
  return (
    <div className="progress-container">
      <div className="progress-fill" style={{ width: `${value}%`, background: color }}></div>
    </div>
  );
};

const Card = ({ children, title, className = "" }) => (
  <div className={`glass-card ${className}`}>
    {title && <h3 className="text-muted" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>{title}</h3>}
    {children}
  </div>
);

// --- DASHBOARDS ---

function StudentDashboard({ user, onLogout }) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/student/${user.id}/metrics`)
      .then(res => setMetrics(res.data))
      .catch(err => console.error(err));
  }, [user.id]);

  if (!metrics) return <div style={{textAlign: 'center', marginTop: '5rem'}}>Loading AI Analysis...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div className="dashboard-header">
        <div>
          <h2>Welcome back, <span className="gradient-text">{user.name}</span></h2>
          <p className="text-muted">Student Portal | Concept Drift Analysis</p>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={onLogout}>Logout</button>
      </div>

      <div className="grid grid-cols-2">
        <Card title="Your Concept Drift Score">
          <div className="flex flex-col items-center justify-center gap-2" style={{ padding: '1rem 0' }}>
            <div style={{ fontSize: '3rem', fontWeight: '700', color: metrics.driftScore > 50 ? 'var(--danger)' : 'var(--secondary)' }}>
              {metrics.driftScore}%
            </div>
            <div className={`badge ${metrics.driftScore > 50 ? 'badge-danger' : 'badge-success'}`}>
              {metrics.status}
            </div>
            <ProgressBar value={metrics.driftScore} colorMap={true} />
            <p className="text-sm text-muted" style={{ marginTop: '1rem', textAlign: 'center' }}>
              {metrics.driftScore > 50 
                ? "Our AI detected a shift in your learning pattern. It seems you might be relying on shortcuts or guessing recent problems." 
                : "You are maintaining consistent conceptual understanding!"}
            </p>
          </div>
        </Card>

        <Card title="Accuracy Trend">
          <div className="flex justify-between" style={{ marginBottom: '1rem' }}>
            <span>Historical Baseline</span>
            <span style={{ fontWeight: 'bold' }}>{metrics.baselineAccuracy}%</span>
          </div>
          <ProgressBar value={metrics.baselineAccuracy} />
          
          <div className="flex justify-between" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
            <span>Recent Performance</span>
            <span style={{ fontWeight: 'bold' }}>{metrics.recentAccuracy}%</span>
          </div>
          <ProgressBar value={metrics.recentAccuracy} />
        </Card>
      </div>
    </div>
  );
}

function InstructorDashboard({ user, onLogout }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/students`)
      .then(res => setStudents(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div className="dashboard-header">
        <div>
          <h2>Instructor Dashboard</h2>
          <p className="text-muted">Monitor Class Concept Drift and Interventions</p>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={onLogout}>Logout</button>
      </div>

      <Card>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Overall Accuracy</th>
              <th>Recent Trend</th>
              <th>AI Drift Score (Risk)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: '500' }}>{s.name}</td>
                <td>{s.metrics?.overallAccuracy || 0}%</td>
                <td>
                  {s.metrics?.recentAccuracy < s.metrics?.baselineAccuracy ? '📉 Declining' : '📈 Stable'}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '40px' }}>{s.metrics?.driftScore || 0}%</span>
                    <div style={{ flex: 1 }}><ProgressBar value={s.metrics?.driftScore || 0} colorMap={true} /></div>
                  </div>
                </td>
                <td>
                  {s.metrics?.driftScore > 50 ? (
                    <button className="btn text-sm" style={{ background: 'var(--danger)', padding: '0.25rem 0.75rem', color: 'white' }}>Intervene</button>
                  ) : (
                    <span className="text-muted text-sm">On Track</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function AdminDashboard({ user, onLogout }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/students`)
      .then(res => setStudents(res.data))
      .catch(err => console.error(err));
  }, []);

  const clever = students.filter(s => s.metrics?.driftScore < 30 && s.metrics?.overallAccuracy > 70);
  const duller = students.filter(s => s.metrics?.driftScore >= 30 || s.metrics?.overallAccuracy <= 50);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="dashboard-header">
        <div>
          <h2 className="gradient-text">Admin Analytics Platform</h2>
          <p className="text-muted">Global Institutional Concept Drift Diagnostics</p>
        </div>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={onLogout}>Logout</button>
      </div>

      <div className="grid grid-cols-2">
        <Card title="High Mastery 'Clever' Students (Low Drift)">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {clever.map(s => (
              <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <span>{s.name}</span>
                <span className="badge badge-success">Drift: {s.metrics?.driftScore}%</span>
              </li>
            ))}
            {clever.length === 0 && <li className="text-muted">No students in this category.</li>}
          </ul>
        </Card>
        
        <Card title="At-Risk 'Duller' Students (High Drift / Low Acc)">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {duller.map(s => (
              <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                <span>{s.name}</span>
                <span className="badge badge-danger">Drift: {s.metrics?.driftScore}%</span>
              </li>
            ))}
             {duller.length === 0 && <li className="text-muted">No students in this category.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// --- MAIN LOGIN SHELL ---

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/login`, { username });
      setUser(res.data.user);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try student1, teacher, admin.');
    }
  };

  if (user) {
    return (
      <div className="app-container">
        {user.role === 'student' && <StudentDashboard user={user} onLogout={() => setUser(null)} />}
        {user.role === 'instructor' && <InstructorDashboard user={user} onLogout={() => setUser(null)} />}
        {user.role === 'admin' && <AdminDashboard user={user} onLogout={() => setUser(null)} />}
      </div>
    );
  }

  return (
    <div className="app-container justify-center items-center">
      <Card className="animate-fade-in" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }} className="gradient-text">ConceptShift AI</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2rem' }}>Drift Detection System Login</p>
        
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            className="input-base" 
            placeholder="Username (e.g. student2, teacher, admin)" 
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Sign In Securely
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', fontSize: '0.875rem' }} className="text-muted">
          <strong>Backend SQL Demo Accounts:</strong><br/>
          • student1 (Low Drift)<br/>
          • student2 (High Drift)<br/>
          • student3 (At-Risk)<br/>
          • teacher (Instructor)<br/>
          • admin (Admin)
        </div>
      </Card>
    </div>
  );
}

export default App;
