import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    BarChart3,
    Settings,
    LogOut,
    Plus,
    Building2,
    ChevronRight,
    TrendingUp,
    MessageSquare,
    Clock
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const queryParams = new URLSearchParams(location.search);
    const selection = {
        class: queryParams.get('class') || 'IIIyr',
        section: queryParams.get('section') || 'A',
        semester: queryParams.get('semester') || 'I'
    };

    const stats = [
        { label: 'Total HODs', value: '12', icon: <Users size={20} />, color: '#6366f1' },
        { label: 'Departments', value: '8', icon: <Building2 size={20} />, color: '#0ea5e9' },
        { label: 'Feedbacks', value: '1,284', icon: <MessageSquare size={20} />, color: '#f43f5e' },
        { label: 'Avg Rating', value: '4.8', icon: <TrendingUp size={20} />, color: '#10b981' },
    ];

    const recentFeedbacks = [
        { id: 1, dept: 'Computer Science', date: '2 hours ago', rating: 5, user: 'John Doe' },
        { id: 2, dept: 'Mechanical', date: '5 hours ago', rating: 4, user: 'Jane Smith' },
        { id: 3, dept: 'Electronics', date: '1 day ago', rating: 5, user: 'Robert Brown' },
    ];

    return (
        <div className="dashboard-container">
            <aside className="sidebar glass-panel">
                <div className="sidebar-header">
                    <div className="logo-small premium-gradient">
                        <BarChart3 size={20} color="white" />
                    </div>
                    <h3>Admin Panel</h3>
                </div>

                <nav className="sidebar-nav">
                    <a href="#" className="nav-item active">
                        <TrendingUp size={18} />
                        <span>Overview</span>
                    </a>
                    <a href="#" className="nav-item">
                        <Building2 size={18} />
                        <span>Departments</span>
                    </a>
                    <a href="#" className="nav-item">
                        <Users size={18} />
                        <span>Manage HODs</span>
                    </a>
                    <a href="#" className="nav-item">
                        <Settings size={18} />
                        <span>Settings</span>
                    </a>
                </nav>

                <button className="logout-btn" onClick={logout}>
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </aside>

            <main className="main-content">
                <header className="content-header">
                    <div className="welcome">
                        <h1>System Overview | {selection.class}-{selection.section} Sem-{selection.semester}</h1>
                        <p className="text-muted">Welcome back, {user?.name || 'Super Admin'}</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="add-task-btn premium-gradient"
                    >
                        <Plus size={18} />
                        <span>Create Report</span>
                    </motion.button>
                </header>

                <section className="stats-grid">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="stat-card glass-panel"
                        >
                            <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                {stat.icon}
                            </div>
                            <div className="stat-info">
                                <span className="text-muted">{stat.label}</span>
                                <h2>{stat.value}</h2>
                            </div>
                        </motion.div>
                    ))}
                </section>

                <section className="dashboard-grid">
                    <div className="grid-main glass-panel">
                        <div className="section-title">
                            <h2>Recent Feedback Activity</h2>
                            <button className="view-all">View All</button>
                        </div>
                        <div className="feedback-list">
                            {recentFeedbacks.map((fb) => (
                                <div key={fb.id} className="feedback-item">
                                    <div className="fb-info">
                                        <strong>{fb.dept}</strong>
                                        <div className="fb-meta">
                                            <Clock size={12} />
                                            <span>{fb.date}</span>
                                        </div>
                                    </div>
                                    <div className="fb-rating">
                                        <span className="rating-pill">⭐ {fb.rating}.0</span>
                                        <ChevronRight size={18} className="text-muted" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid-side glass-panel">
                        <div className="section-title">
                            <h2>Top Departments</h2>
                        </div>
                        <div className="dept-stats">
                            <div className="dept-stat-row">
                                <span>Computer Science</span>
                                <div className="progress-bar"><div className="progress" style={{ width: '90%' }}></div></div>
                            </div>
                            <div className="dept-stat-row">
                                <span>Information Tech</span>
                                <div className="progress-bar"><div className="progress" style={{ width: '85%' }}></div></div>
                            </div>
                            <div className="dept-stat-row">
                                <span>Mechanical Eng</span>
                                <div className="progress-bar"><div className="progress" style={{ width: '70%' }}></div></div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
