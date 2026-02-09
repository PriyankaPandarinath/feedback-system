require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5002;
const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key_123';

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- DATA ACCESS HELPERS ---

// 1. Users Data (Read-only, bundled)
let usersData = [];
try {
    usersData = require('./data/users.json');
    console.log(`Loaded ${usersData.length} users via require`);
} catch (e) {
    console.error("Failed to require users.json:", e);
}

const getUsers = () => usersData;

// 2. Feedback Data (Read/Write, needs /tmp in Vercel)
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
const FEEDBACK_PATH = isVercel
    ? path.join('/tmp', 'feedback.json')
    : path.join(__dirname, 'data', 'feedback.json');

// LOAD SEED DATA ALWAYS (Forces bundler to include it)
let initialSeedData = [];
try {
    initialSeedData = require('./data/initial_feedback.json');
    console.log(`Loaded ${initialSeedData.length} initial feedback seed entries.`);
} catch (e) {
    console.error("Failed to require initial_feedback.json:", e);
}

const initFeedbackStorage = () => {
    try {
        // Ensure /tmp exists if we are using it (Vercel usually has it)
        if (isVercel && !fs.existsSync('/tmp')) {
            console.log('/tmp directory does not exist, skipping persistence init');
            return;
        }

        let existingData = [];
        if (fs.existsSync(FEEDBACK_PATH)) {
            try {
                const fileContent = fs.readFileSync(FEEDBACK_PATH, 'utf8');
                existingData = JSON.parse(fileContent);
            } catch (e) {
                console.error("Error parsing existing feedback:", e);
                // If corrupted, we might want to overwrite, or just ignore.
                // For now, let's treat it as empty.
            }
        }

        // If missing or empty, seed it!
        if (!existingData || existingData.length === 0) {
            console.log(`Feedback file empty or missing. Seeding with ${initialSeedData.length} entries at ${FEEDBACK_PATH}`);
            try {
                fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(initialSeedData, null, 4));
            } catch (writeErr) {
                console.error(`Failed to write seed data to ${FEEDBACK_PATH}:`, writeErr);
                // CRITICAL: Do not throw here, just continue with in-memory or empty state
                // specific for Vercel read-only filesystem issues
            }
        } else {
            console.log(`Feedback file exists with ${existingData.length} entries.`);
        }
    } catch (err) {
        console.error("Failed to initialize feedback storage (suppressed):", err);
    }
};

// Run init on startup
initFeedbackStorage();

const getFeedback = () => {
    try {
        if (!fs.existsSync(FEEDBACK_PATH)) return initialSeedData; // Fallback only if file missing
        const data = JSON.parse(fs.readFileSync(FEEDBACK_PATH, 'utf8'));
        return data; // Return data even if empty array
    } catch (e) {
        console.error("Failed to read feedback config:", e);
        return [];
    }
};

const saveFeedback = (data) => {
    try {
        fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(data, null, 4));
        return true;
    } catch (e) {
        console.error("Failed to save feedback:", e);
        return false;
    }
};

// --- SUBJECTS DATA ---
// --- SUBJECTS DATA ---
// --- SUBJECTS DATA ---
const subjects = [
    // II Year - Semester II
    { id: 'dm1', name: 'Discrete Mathematics', type: 'theory', class: 'IIyr', semester: 'II', faculties: { A: 'Mrs Lakshmi', B: 'Mrs Lakshmi' } },
    { id: 'bef1', name: 'Business Economics & Financial', type: 'theory', class: 'IIyr', semester: 'II', faculties: { A: 'Mr K Venkat raju', B: 'Mr K Venkat raju' } },
    { id: 'os1', name: 'Operating Systems', type: 'theory', class: 'IIyr', semester: 'II', faculties: { A: 'Mrs.B Rajani', B: 'Mrs.B Rajani' } },
    { id: 'dbms1', name: 'Database Management Systems', type: 'theory', class: 'IIyr', semester: 'II', faculties: { A: 'Mrs T Spoorthi reddy', B: 'Mrs Priyanka Pandarinath' } },
    { id: 'se1', name: 'Software Engineering', type: 'theory', class: 'IIyr', semester: 'II', faculties: { A: 'Mrs M Pooja', B: 'Mrs M Pooja' } },
    { id: 'osl1', name: 'Operating Systems Lab', type: 'lab', class: 'IIyr', semester: 'II', faculties: { A: 'Mrs.B Rajani', B: 'Mrs.B Rajani' } },
    { id: 'dbmsl1', name: 'Database Management Systems Lab', type: 'lab', class: 'IIyr', semester: 'II', faculties: { A: 'Mrs T Spoorthi reddy', B: 'Mrs Priyanka Pandarinath' } },
    { id: 'rtrp1', name: 'Real-time Research Project', type: 'theory', class: 'IIyr', semester: 'II', faculties: { A: 'Mr D Kishore kumar', B: 'Mr D Kishore kumar' } },
    { id: 'coi1', name: 'Constitution of India', type: 'theory', class: 'IIyr', semester: 'II', faculties: { A: 'Mrs Lakshmi', B: 'Mrs Lakshmi' } },
    { id: 'sdc1', name: 'Skill Development Course -Node JS', type: 'theory', class: 'IIyr', semester: 'II', faculties: { A: 'Mr D Kishore kumar', B: 'Mr D Kishore kumar' } },

    // III Year - Semester II
    { id: 'atcd1', name: 'Automata Theory and Compiler Design', type: 'theory', class: 'IIIyr', semester: 'II', faculties: { A: 'Mr N ravi shankar', B: 'Mr N ravi shankar' } },
    { id: 'ada1', name: 'Algorithm Design and Analysis', type: 'theory', class: 'IIIyr', semester: 'II', faculties: { A: 'Mrs K Nandhini', B: 'Mrs K Nandhini' } },
    { id: 'bda1', name: 'Big Data Analytics', type: 'theory', class: 'IIIyr', semester: 'II', faculties: { A: 'Mr P Srinivas', B: 'Mr P Srinivas' } },
    { id: 'sl1', name: 'Scripting Languages', type: 'theory', class: 'IIIyr', semester: 'II', faculties: { A: 'Miss N Sujana', B: 'Mrs G SriRamya' } },
    { id: 'oop1', name: 'Object Oriented Programming using C++', type: 'theory', class: 'IIIyr', semester: 'II', faculties: { A: 'Mrs V Indrani', B: 'Mrs V Indrani' } },
    { id: 'bdal1', name: 'Big Data Analytics Lab', type: 'lab', class: 'IIIyr', semester: 'II', faculties: { A: 'Mr P Srinivas', B: 'Mr P Srinivas' } },
    { id: 'sll1', name: 'Scripting Languages Lab', type: 'lab', class: 'IIIyr', semester: 'II', faculties: { A: 'Miss N Sujana', B: 'Mrs G SriRamya' } },
    { id: 'aecs1', name: 'Advanced English Communication Skills', type: 'lab', class: 'IIIyr', semester: 'II', faculties: { A: 'Mrs Anuradha', B: 'Mrs Anuradha' } },
    { id: 'es1', name: 'Environmental Science', type: 'theory', class: 'IIIyr', semester: 'II', faculties: { A: 'Mrs P Kamala', B: 'Mrs P Kamala' } },
    { id: 'imp1', name: 'Industrial Oriented Mini Project', type: 'lab', class: 'IIIyr', semester: 'II', faculties: { A: 'Mrs K Nandhini', B: 'Mrs K Nandhini' } },

    // IV Year - Semester II
    { id: 'ob1', name: 'Organizational Behaviour', type: 'theory', class: 'IVyr', semester: 'II', faculties: { A: 'Mrs Padmaja', B: 'Mrs Padmaja' } },
    { id: 'ws1', name: 'Web Security', type: 'theory', class: 'IVyr', semester: 'II', faculties: { A: 'Mr R Manoj Kumar', B: 'Mr R Manoj Kumar' } },
    { id: 'cb1', name: 'Chatbots', type: 'theory', class: 'IVyr', semester: 'II', faculties: { A: 'Mr Vinay Sagar', B: 'Mr Vinay Sagar' } },
    { id: 'ps2', name: 'Project Stage-II Including Seminar', type: 'lab', class: 'IVyr', semester: 'II', faculties: { A: 'Mr Vinay Sagar', B: 'Mr Vinay Sagar' } }
];

// --- ROUTES ---

app.get('/', (req, res) => {
    res.json({ status: 'API is running', endpoints: ['/api/login', '/api/me', '/api/feedback', '/api/analytics'] });
});

app.get('/api/debug', (req, res) => {
    res.json({
        message: 'Debug endpoint working',
        time: new Date().toISOString(),
        usersLoaded: usersData.length,
        cwd: process.cwd(),
        isVercel: !!process.env.VERCEL
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        userCount: usersData.length,
        feedbackPath: FEEDBACK_PATH,
        isVercel: isVercel
    });
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password, role, rollnumber } = req.body;
        const users = getUsers();

        let user;
        if (role === 'student') {
            user = users.find(u => u.rollnumber === rollnumber && u.role === 'student');
        } else {
            user = users.find(u => u.email === email && u.role === role);
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or role' });
        }

        // Simple password check (demo only)
        const isMatch = (password === 'admin123' && user.role === 'admin') ||
            (password === 'hod123' && user.role === 'hod') ||
            (password === 'password123' && user.role === 'student');

        if (!isMatch) {
            // Fallback to bcrypt if we had real hashes
            try {
                if (user.password && user.password.startsWith('$2')) {
                    const bcryptMatch = await bcrypt.compare(password, user.password);
                    if (!bcryptMatch) return res.status(401).json({ message: 'Invalid credentials' });
                } else if (user.password !== password) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
            } catch (e) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                class: user.class,
                section: user.section,
                semester: user.semester
            },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        const userData = {
            id: user.id,
            email: user.email,
            role: user.role,
            rollnumber: user.rollnumber, // Added rollnumber
            name: user.name,
            class: user.class,
            section: user.section,
            semester: user.semester,
            feedbackRestricted: false,
            daysRemaining: 0
        };

        // CHECK FEEDBACK RESTRICTION FOR STUDENTS
        if (user.role === 'student') {
            const allFeedback = getFeedback();
            const studentFeedback = allFeedback.filter(f => f.rollnumber === user.rollnumber);

            // Get all subjects for this student's class
            const classSubjects = subjects.filter(s => s.class === user.class);

            // Check if ALL subjects have feedback
            const completedCount = studentFeedback.length;
            const totalSubjects = classSubjects.length;

            if (completedCount >= totalSubjects && totalSubjects > 0) {
                const sortedFeedback = studentFeedback.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                const lastSubmission = sortedFeedback[0];

                if (lastSubmission) {
                    const lastDate = new Date(lastSubmission.timestamp);
                    const now = new Date();
                    const diffTime = Math.abs(now - lastDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    const RESTRICTION_DAYS = 15;

                    if (diffDays <= RESTRICTION_DAYS) {
                        userData.feedbackRestricted = true;
                        userData.daysRemaining = RESTRICTION_DAYS - diffDays + 1;
                    }
                }
            }
        }

        res.json({
            token,
            user: userData
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.get('/api/subjects', (req, res) => {
    const { section, class: studentClass, semester } = req.query;
    if (!section || !studentClass) {
        return res.status(400).json({ message: 'Section and Class are required' });
    }

    let filteredSubjects = subjects.filter(s => s.class === studentClass);

    if (semester) {
        filteredSubjects = filteredSubjects.filter(s => s.semester === semester);
    }

    const responseSubjects = filteredSubjects.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        faculty: s.faculties[section] || s.faculties['A'] || 'N/A'
    }));

    res.json(responseSubjects);
});

app.post('/api/feedback', (req, res) => {
    try {
        const newFeedback = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            ...req.body
        };

        const feedback = getFeedback();

        // Check for duplicate submission
        const isDuplicate = feedback.some(f =>
            (f.rollnumber && f.rollnumber === req.body.rollnumber && f.subjectId === req.body.subjectId) ||
            (f.studentId && f.studentId === req.body.studentId && f.subjectId === req.body.subjectId)
        );

        if (isDuplicate) {
            return res.status(400).json({ message: 'Feedback already submitted for this subject.' });
        }

        feedback.push(newFeedback);

        if (saveFeedback(feedback)) {
            res.status(201).json({ message: 'Feedback submitted successfully' });
        } else {
            res.status(500).json({ message: 'Failed to save feedback to disk' });
        }
    } catch (error) {
        console.error("Feedback Error:", error);
        res.status(500).json({ message: 'Failed to process feedback' });
    }
});

app.get('/api/feedback/progress', (req, res) => {
    try {
        const { rollnumber } = req.query;
        if (!rollnumber) return res.status(400).json({ message: 'Roll number required' });

        const allFeedback = getFeedback();
        const studentFeedback = allFeedback.filter(f => f.rollnumber === rollnumber);

        // Return list of subjectIds that are done
        const completedSubjectIds = studentFeedback.map(f => f.subjectId);

        res.json({ completedSubjectIds });
    } catch (error) {
        console.error("Progress Error:", error);
        res.status(500).json({ message: 'Failed to fetch progress' });
    }
});

app.get('/api/analytics', (req, res) => {
    const { class: year, section, semester } = req.query;
    console.log(`Analytics Request: Year=${year}, Section=${section}, Sem=${semester}`);

    // 1. Calculate Total Students for this selection
    const allUsers = getUsers();
    const studentCount = allUsers.filter(u =>
        u.role === 'student' &&
        u.class === year &&
        u.section === section &&
        u.semester === semester
    ).length;

    console.log(`Total students in ${year}-${section} (Sem ${semester}): ${studentCount}`);

    // 2. Filter Feedback
    const allFeedback = getFeedback();
    let filtered = allFeedback;
    if (year) filtered = filtered.filter(f => f.class === year);
    if (section) filtered = filtered.filter(f => f.section === section);
    if (semester) filtered = filtered.filter(f => f.semester === semester);

    console.log(`Filtered feedback records: ${filtered.length}`);

    const statsMap = {};

    filtered.forEach(f => {
        // Only include valid ratings
        if (!f.ratings) return;

        const key = `${f.subject}-${f.faculty}`;
        if (!statsMap[key]) {
            statsMap[key] = {
                faculty: f.faculty,
                subject: f.subject,
                type: 'theory', // default
                count: 0,
                params: {}
            };
            // Try to find type from subjects list
            const subDef = subjects.find(s => s.name === f.subject);
            if (subDef) statsMap[key].type = subDef.type;
        }

        const entry = statsMap[key];
        entry.count += 1;

        Object.entries(f.ratings).forEach(([param, value]) => {
            entry.params[param] = (entry.params[param] || 0) + Number(value);
        });
    });

    const processStats = (entry) => {
        const paramPercents = {};
        let totalPercentSum = 0;
        let paramCount = 0;

        // Use entry.count (submissions) for the denominator to get the average of received feedback
        const denominatorBlock = entry.count;

        Object.keys(entry.params).sort().forEach(param => {
            // Formula: (Sum of Ratings / (Total Students * 5)) * 100
            const sumRating = entry.params[param];
            // Max possible rating for this parameter if ALL students gave 5
            const maxPossible = denominatorBlock * 5;

            const percent = (sumRating / maxPossible) * 100;

            paramPercents[param] = Math.round(percent);
            totalPercentSum += percent;
            paramCount++;
        });

        return {
            faculty: entry.faculty,
            subject: entry.subject,
            ...paramPercents,
            feedback: paramCount > 0 ? Math.round(totalPercentSum / paramCount) : 0
        };
    };

    const theoryStats = [];
    const labStats = [];

    Object.values(statsMap).forEach(entry => {
        const processed = processStats(entry);
        if (entry.type === 'theory') {
            theoryStats.push(processed);
        } else {
            labStats.push(processed);
        }
    });

    res.json({
        totalSubmissions: filtered.length,
        totalStudents: studentCount, // Return total students context
        theoryStats,
        labStats,
        // Keep old format for compatibility if needed, or just send empty arrays
        coursePerformance: [],
        facultyPerformance: []
    });
});

app.get('/api/analytics/submissions', (req, res) => {
    const { class: year, section, semester } = req.query;
    if (!year || !section || !semester) {
        return res.status(400).json({ message: 'Class, Section and Semester are required' });
    }

    try {
        // 1. Get Students
        const allUsers = getUsers();
        const students = allUsers.filter(u =>
            u.role === 'student' &&
            u.class === year &&
            u.section === section &&
            u.semester === semester
        );
        // 2. Get Subjects
        const classSubjects = subjects.filter(s => s.class === year);
        const totalSubjects = classSubjects.length;

        // 3. Get Feedback
        const allFeedback = getFeedback();

        // 4. Map Status
        const studentStatusList = students.map(student => {
            const studentFeedback = allFeedback.filter(f =>
                (f.rollnumber === student.rollnumber) ||
                (f.studentId === student.rollnumber)
            );

            // Count unique subjects submitted
            const submittedSubjectIds = new Set(studentFeedback.map(f => f.subjectId));
            const completedCount = submittedSubjectIds.size;

            let status = 'Pending';
            if (totalSubjects > 0 && completedCount >= totalSubjects) {
                status = 'Completed';
            } else if (completedCount > 0) {
                status = 'In Progress';
            }

            return {
                rollnumber: student.rollnumber,
                name: student.name,
                completedCount,
                totalSubjects,
                status
            };
        });

        // Sort: Pending first, then In Progress, then Completed
        studentStatusList.sort((a, b) => {
            const statusOrder = { 'Pending': 1, 'In Progress': 2, 'Completed': 3 };
            return statusOrder[a.status] - statusOrder[b.status];
        });

        res.json({
            totalSubmissions: filtered.length,
            totalStudents: studentCount,
            stats: studentStatusList
        });

    } catch (error) {
        console.error("Submission Analytics Error:", error);
        res.status(500).json({ message: 'Failed to fetch submission analytics' });
    }
});

app.get('/api/me', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Failed to authenticate token' });
        res.json(decoded);
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Critical Server Error:", err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'See server logs'
    });
});

// Start Server (Only if NOT in Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
