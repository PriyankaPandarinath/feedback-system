import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    LogOut,
    TrendingUp,
    MessageSquare,
    Clock,
    BookOpen,
    PieChart,
    ChevronRight,
    Sparkles,
    Users, /* NEW ICON */
    Calendar
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';
import './FeedbackTable.css'; // New styles for tables

const HODDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const queryParams = new URLSearchParams(location.search);

    // HOD Selection State - Default to IIIyr, A, II if params missing
    const [selection, setSelection] = useState({
        class: queryParams.get('class') || 'IIIyr',
        section: queryParams.get('section') || 'A',
        semester: queryParams.get('semester') || 'II'
    });

    // Update URL when selection changes (optional, but good for bookmarking/refresh)
    useEffect(() => {
        const params = new URLSearchParams(selection);
        navigate(`?${params.toString()}`, { replace: true });
    }, [selection, navigate]);

    const [analytics, setAnalytics] = useState({
        totalSubmissions: 0,
        coursePerformance: [],
        facultyPerformance: []
    });

    const [submissionStats, setSubmissionStats] = useState({
        stats: [],
        totalStudents: 0,
        completedCount: 0
    });

    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('class'); // 'class', 'faculty', 'subject'

    useEffect(() => {
        if (activeTab === 'submissions') {
            fetchSubmissionStats();
        } else {
            fetchAnalytics();
        }
    }, [selection, activeTab]);

    const fetchSubmissionStats = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                class: selection.class,
                section: selection.section,
                semester: selection.semester
            });
            const res = await fetch(`/api/analytics/submissions?${queryParams.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch submission stats");
            const data = await res.json();
            setSubmissionStats(data);
        } catch (error) {
            console.error("Failed to fetch submission stats", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            let queryParams = new URLSearchParams();
            queryParams.append('semester', selection.semester);

            // Always filter by the selected Class and Section
            queryParams.append('class', selection.class);
            queryParams.append('section', selection.section);

            const res = await fetch(`/api/analytics?${queryParams.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectionChange = (key, value) => {
        setSelection(prev => ({ ...prev, [key]: value }));
    };

    // --- Aggregation Logic for Faculty/Subject Views ---
    const getAggregatedStats = (type) => {
        const allStats = [...(analytics.theoryStats || []), ...(analytics.labStats || [])];
        const map = {};

        allStats.forEach(item => {
            const key = type === 'faculty' ? item.faculty : item.subject;
            if (!map[key]) {
                map[key] = { name: key, totalScore: 0, count: 0 };
            }
            map[key].totalScore += parseFloat(item.feedback);
            map[key].count += 1;
        });

        return Object.values(map).map(item => ({
            name: item.name,
            score: (item.totalScore / item.count).toFixed(1)
        })).sort((a, b) => b.score - a.score);
    };

    const calculateOverallPerformance = () => {
        let total = 0;
        let count = 0;

        if (analytics.theoryStats) {
            analytics.theoryStats.forEach(s => {
                const val = parseFloat(s.feedback);
                if (!isNaN(val)) { total += val; count++; }
            });
        }
        if (analytics.labStats) {
            analytics.labStats.forEach(s => {
                const val = parseFloat(s.feedback);
                if (!isNaN(val)) { total += val; count++; }
            });
        }

        return count > 0 ? (total / count).toFixed(1) : '0';
    };

    const overallPerformance = calculateOverallPerformance();

    return (
        <div className="dashboard-container">
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Loading Dashboard Data...</p>
                </div>
            )}
            <aside className="sidebar glass-panel">
                <div className="sidebar-header">
                    <div className="logo-small premium-gradient">
                        <BookOpen size={20} color="white" />
                    </div>
                    <h3>Data Science</h3>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'class' ? 'active' : ''}`}
                        onClick={() => setActiveTab('class')}
                    >
                        <TrendingUp size={18} />
                        <span>Class Analysis</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'faculty' ? 'active' : ''}`}
                        onClick={() => setActiveTab('faculty')}
                    >
                        <Sparkles size={18} />
                        <span>Faculty Wise</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'subject' ? 'active' : ''}`}
                        onClick={() => setActiveTab('subject')}
                    >
                        <BookOpen size={18} />
                        <span>Subject Wise</span>
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'submissions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('submissions')}
                    >
                        <Users size={18} />
                        <span>Submission Status</span>
                    </button>
                </nav>

                <button className="logout-btn" onClick={logout}>
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </aside>

            <main className="main-content">
                <header className="content-header">
                    <div className="welcome">
                        <h1>Welcome back, HOD</h1>
                        <p className="text-muted">Overview for <strong>{selection.class} - {selection.section} (Sem {selection.semester})</strong></p>
                    </div>

                    <div className="header-actions">
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select
                                value={selection.class}
                                onChange={(e) => setSelection({ ...selection, class: e.target.value })}
                                className="glass-select"
                            >
                                <option value="IIyr">II Year</option>
                                <option value="IIIyr">III Year</option>
                                <option value="IVyr">IV Year</option>
                            </select>

                            <select
                                value={selection.section}
                                onChange={(e) => setSelection({ ...selection, section: e.target.value })}
                                className="glass-select"
                            >
                                <option value="A">Section A</option>
                                <option value="B">Section B</option>
                            </select>

                            <select
                                value={selection.semester}
                                onChange={(e) => setSelection({ ...selection, semester: e.target.value })}
                                className="glass-select"
                            >
                                <option value="I">Sem I</option>
                                <option value="II">Sem II</option>
                            </select>
                        </div>

                        <div className="date-badge">
                            <Calendar size={16} />
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </header>

                {activeTab === 'submissions' ? (
                    <section className="dashboard-grid-full">
                        <div className="grid-full glass-panel">
                            <div className="section-title">
                                <div className="title-with-badge">
                                    <h2>Student Submission Status</h2>
                                    <span className="student-count-badge">
                                        Completed: {submissionStats.completedCount} / {submissionStats.totalStudents}
                                    </span>
                                </div>
                            </div>
                            <div className="table-container">
                                <table className="feedback-table">
                                    <thead>
                                        <tr>
                                            <th>Roll Number</th>
                                            <th>Student Name</th>
                                            <th>Progress</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissionStats.stats.length > 0 ? (
                                            submissionStats.stats.map((student, idx) => (
                                                <tr key={idx}>
                                                    <td>{student.rollnumber}</td>
                                                    <td>{student.name}</td>
                                                    <td>{student.completedCount} / {student.totalSubjects}</td>
                                                    <td>
                                                        <span className={`status-badge ${student.status === 'Completed' ? 'success' :
                                                            student.status === 'In Progress' ? 'warning' : 'pending'
                                                            }`}>
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="4" className="text-center">No students found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                ) : activeTab === 'class' ? (
                    <>
                        {/* Class View Content */}
                        <section className="overall-stats-container">
                            {/* ... (Keep existing Overall Card) ... */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="overall-card glass-panel premium-gradient-border"
                            >
                                <div className="overall-info">
                                    <h2>Overall Class Performance</h2>
                                    <p className="text-muted">Aggregate score based on current feedback</p>
                                </div>
                                <div className="overall-score">
                                    <div className="score-circle">
                                        <span>{overallPerformance}%</span>
                                    </div>
                                </div>
                            </motion.div>
                        </section>

                        <section className="dashboard-grid-full">
                            {/* Theory Subjects Table */}
                            <div className="grid-full glass-panel">
                                <div className="section-title">
                                    <div className="title-with-badge">
                                        <h2>Theory Subjects Feedback of class {selection.class}-{selection.section}</h2>
                                        <span className="student-count-badge">
                                            Strength: {analytics?.totalStudents || 0}
                                        </span>
                                    </div>
                                </div>
                                <div className="table-container">
                                    <table className="feedback-table">
                                        <thead>
                                            <tr>
                                                <th>sno</th>
                                                <th>faculty name</th>
                                                <th>subject name</th>
                                                <th>p1(%)</th><th>p2(%)</th><th>p3(%)</th><th>p4(%)</th><th>p5(%)</th>
                                                <th>p6(%)</th><th>p7(%)</th><th>p8(%)</th><th>p9(%)</th><th>p10(%)</th>
                                                <th>feedback(%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.theoryStats && analytics.theoryStats.length > 0 ? (
                                                analytics.theoryStats.map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td>{idx + 1}</td>
                                                        <td>{row.faculty}</td>
                                                        <td>{row.subject}</td>
                                                        <td>{row.p1 || '-'}</td><td>{row.p2 || '-'}</td><td>{row.p3 || '-'}</td>
                                                        <td>{row.p4 || '-'}</td><td>{row.p5 || '-'}</td><td>{row.p6 || '-'}</td>
                                                        <td>{row.p7 || '-'}</td><td>{row.p8 || '-'}</td><td>{row.p9 || '-'}</td>
                                                        <td>{row.p10 || '-'}</td>
                                                        <td><strong>{row.feedback}</strong></td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="14" className="text-center">No theory feedback data available.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Lab Subjects Table */}
                            <div className="grid-full glass-panel" style={{ marginTop: '2rem' }}>
                                <div className="section-title">
                                    <h2>Laboratory Subjects Feedback of class {selection.class}-{selection.section}</h2>
                                </div>
                                <div className="table-container">
                                    <table className="feedback-table">
                                        <thead>
                                            <tr>
                                                <th>sno</th>
                                                <th>faculty name</th>
                                                <th>subject name</th>
                                                <th>p1(%)</th><th>p2(%)</th><th>p3(%)</th><th>p4(%)</th>
                                                <th>p5(%)</th><th>p6(%)</th><th>p7(%)</th><th>p8(%)</th>
                                                <th>feedback(%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.labStats && analytics.labStats.length > 0 ? (
                                                analytics.labStats.map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td>{idx + 1}</td>
                                                        <td>{row.faculty}</td>
                                                        <td>{row.subject}</td>
                                                        <td>{row.l1 || '-'}</td><td>{row.l2 || '-'}</td><td>{row.l3 || '-'}</td>
                                                        <td>{row.l4 || '-'}</td><td>{row.l5 || '-'}</td><td>{row.l6 || '-'}</td>
                                                        <td>{row.l7 || '-'}</td><td>{row.l8 || '-'}</td>
                                                        <td><strong>{row.feedback}</strong></td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="12" className="text-center">No lab feedback data available.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </>
                ) : (
                    <section className="dashboard-grid-full">
                        <div className="grid-full glass-panel">
                            <div className="section-title">
                                <h2>{activeTab === 'faculty' ? 'Faculty Wise Performance' : 'Subject Wise Performance'}</h2>
                            </div>
                            <div className="table-container">
                                <table className="feedback-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>{activeTab === 'faculty' ? 'Faculty Name' : 'Subject Name'}</th>
                                            <th>Average Score (%)</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getAggregatedStats(activeTab).length > 0 ? (
                                            getAggregatedStats(activeTab).map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>#{idx + 1}</td>
                                                    <td>{item.name}</td>
                                                    <td>
                                                        <span className="rating-pill" style={{
                                                            background: item.score >= 90 ? 'rgba(16, 185, 129, 0.1)' :
                                                                item.score >= 70 ? 'rgba(245, 158, 11, 0.1)' :
                                                                    'rgba(239, 68, 68, 0.1)',
                                                            color: item.score >= 90 ? '#10b981' :
                                                                item.score >= 70 ? '#f59e0b' :
                                                                    '#ef4444'
                                                        }}>
                                                            {item.score}%
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {item.score >= 90 ? 'Excellent' :
                                                            item.score >= 80 ? 'Good' :
                                                                item.score >= 70 ? 'Satisfactory' : 'Needs Improvement'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="4" className="text-center">No data available for this view.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}
            </main >
        </div >
    );
};

export default HODDashboard;
