const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite DB (creates file if not exists)
const dbPath = path.resolve(__dirname, 'drift_system.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDB();
    }
});

function initializeDB() {
    db.serialize(() => {
        // Create Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            name TEXT,
            role TEXT
        )`);

        // Create Interactions Table
        db.run(`CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId TEXT,
            topic TEXT,
            correct BOOLEAN,
            timeSecs INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(studentId) REFERENCES users(id)
        )`);

        // Seed Users if empty
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
            if (row && row.count === 0) {
                const stmt = db.prepare("INSERT INTO users (id, username, name, role) VALUES (?, ?, ?, ?)");
                stmt.run('s1', 'student1', 'Alex Johnson', 'student');
                stmt.run('s2', 'student2', 'Sarah Williams', 'student');
                stmt.run('s3', 'student3', 'Michael Chen', 'student');
                stmt.run('t1', 'teacher', 'Prof. Davis', 'instructor');
                stmt.run('a1', 'admin', 'System Admin', 'admin');
                stmt.finalize();
                console.log('Users seeded.');
                seedInteractions();
            }
        });
    });
}

function seedInteractions() {
    const interactions = [
        // Alex: Consistent learner (Low Drift)
        ['s1', 'Algebra', 1, 45], ['s1', 'Algebra', 1, 50], ['s1', 'Calculus', 1, 120], ['s1', 'Calculus', 1, 110],
        // Sarah: Experiencing Concept Drift (Started good, now guessing fast and failing)
        ['s2', 'Physics', 1, 60], ['s2', 'Physics', 1, 65], ['s2', 'Quantum', 0, 15], ['s2', 'Quantum', 0, 10],
        // Michael: Struggling conceptually
        ['s3', 'Statistics', 0, 100], ['s3', 'Statistics', 0, 90], ['s3', 'Probability', 0, 85], ['s3', 'Probability', 1, 15]
    ];
    
    // Add varying timestamps to simulate time passing
    const stmt = db.prepare("INSERT INTO interactions (studentId, topic, correct, timeSecs, timestamp) VALUES (?, ?, ?, ?, datetime('now', ?))");
    interactions.forEach((i, idx) => {
        const timeOffset = `-${10 - idx} days`;
        stmt.run(i[0], i[1], i[2], i[3], timeOffset);
    });
    stmt.finalize();
    console.log('Interactions seeded.');
}

module.exports = db;
