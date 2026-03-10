const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Auth Login API
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: "User not found" });
        res.json({ user: row });
    });
});

// Fetch all students (For Instructor & Admin Dashboards)
app.get('/api/students', (req, res) => {
    db.all("SELECT * FROM users WHERE role = 'student'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Compute drift metrics for each student before returning
        const promises = rows.map(student => {
            return new Promise((resolve) => {
                analyzeStudentDrift(student.id, (metrics) => {
                    student.metrics = metrics;
                    resolve(student);
                });
            });
        });

        Promise.all(promises).then(data => res.json(data));
    });
});

// Fetch specific student metrics
app.get('/api/student/:id/metrics', (req, res) => {
    analyzeStudentDrift(req.params.id, (metrics) => {
        res.json(metrics);
    });
});

// AI Simulated concept drift heuristic
function analyzeStudentDrift(studentId, callback) {
    db.all("SELECT * FROM interactions WHERE studentId = ? ORDER BY timestamp ASC", [studentId], (err, rows) => {
        if (err || rows.length < 4) {
             return callback({ driftScore: 0, baselineAccuracy: 100, recentAccuracy: 100, overallAccuracy: 100, status: 'Not enough data' });
        }

        const mid = Math.floor(rows.length / 2);
        const baseline = rows.slice(0, mid);
        const recent = rows.slice(mid);

        const calcAcc = (arr) => arr.filter(i => i.correct).length / arr.length * 100;
        const calcAvgTime = (arr) => arr.reduce((acc, curr) => acc + curr.timeSecs, 0) / arr.length;

        const baseAcc = calcAcc(baseline);
        const recAcc = calcAcc(recent);
        const baseTime = calcAvgTime(baseline);
        const recTime = calcAvgTime(recent);

        let driftScore = 0;
        if (recAcc < baseAcc) driftScore += (baseAcc - recAcc) * 0.8; 
        if (recTime < baseTime * 0.5) driftScore += 30; // Speeding up + failing = guessing

        driftScore = Math.min(Math.max(Math.round(driftScore), 0), 100);
        let status = 'Stable Learning';
        if (driftScore > 60) status = 'Critical Concept Drift';
        else if (driftScore > 30) status = 'Warning: Early Drift Signs';

        callback({
            driftScore,
            baselineAccuracy: Math.round(baseAcc),
            recentAccuracy: Math.round(recAcc),
             overallAccuracy: Math.round(calcAcc(rows)),
            status
        });
    });
}

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
