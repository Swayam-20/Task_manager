import { useEffect, useMemo, useState } from 'react';
import {
    BrowserRouter,
    Navigate,
    Outlet,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import { Alert, Spinner } from './components/UI';
import { AuthProvider, useAuth } from './context/AuthContext';
import { projectsAPI } from './services/api';
import { getApiError } from './utils/helpers';
import ErrorBoundary from './components/ErrorBoundary';

const PlaceholderPage = ({ title, description }) => (
    <div className="card">
        <div className="card-title" style={{ marginBottom: 8 }}>{title}</div>
        <p className="text-muted">{description}</p>
    </div>
);

const NotFoundPage = () => (
    <div className="card">
        <div className="card-title" style={{ marginBottom: 8 }}>Page not found</div>
        <p className="text-muted">The page you requested does not exist.</p>
    </div>
);

function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) return <Spinner full />;
    if (!user) return <Navigate to="/login" replace />;
    return <Outlet />;
}

function PublicRoute() {
    const { user, loading } = useAuth();

    if (loading) return <Spinner full />;
    if (user) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}

function AppLayout() {
    const [projects, setProjects] = useState([]);
    const [projectsError, setProjectsError] = useState('');
    const location = useLocation();

    useEffect(() => {
        let active = true;
        projectsAPI.getAll()
            .then((res) => {
                if (active) setProjects(res.data?.projects || []);
            })
            .catch((err) => {
                if (active) {
                    setProjects([]);
                    setProjectsError(getApiError(err));
                }
            });
        return () => { active = false; };
    }, []);

    const pageTitle = useMemo(() => {
        const path = location.pathname;
        if (path.startsWith('/dashboard')) return 'Dashboard';
        if (path.startsWith('/projects')) return 'Projects';
        if (path.startsWith('/tasks')) return 'Tasks';
        if (path.startsWith('/team')) return 'Team';
        return 'TaskFlow';
    }, [location.pathname]);

    return (
        <div className="app-layout">
            <Sidebar projects={projects} />
            <div className="main-content">
                <div className="topbar">
                    <div className="topbar-title">{pageTitle}</div>
                </div>
                <main className="page-content">
                    <Alert type="info" message={projectsError ? `Sidebar projects unavailable: ${projectsError}` : ''} />
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<RootRedirect />} />

            <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route
                        path="/projects"
                        element={<PlaceholderPage title="Projects" description="Projects view is not added yet." />}
                    />
                    <Route
                        path="/projects/:id"
                        element={<PlaceholderPage title="Project Details" description="Project details page is not added yet." />}
                    />
                    <Route
                        path="/tasks"
                        element={<PlaceholderPage title="Tasks" description="Tasks view is not added yet." />}
                    />
                    <Route
                        path="/team"
                        element={<PlaceholderPage title="Team" description="Team view is not added yet." />}
                    />
                </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

function RootRedirect() {
    const { user, loading } = useAuth();

    if (loading) return <Spinner full />;
    return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </ErrorBoundary>
    );
}
