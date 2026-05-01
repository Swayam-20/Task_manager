import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        if (typeof window === 'undefined') return null;
        try { return JSON.parse(window.localStorage.getItem('user')); } catch { return null; }
    });
    const [loading, setLoading] = useState(() => {
        if (typeof window === 'undefined') return false;
        return Boolean(window.localStorage.getItem('token'));
    });

    // Verify token on mount
    useEffect(() => {
        const token = window.localStorage.getItem('token');
        if (!token) return;
        authAPI.me()
            .then(res => setUser(res.data.user))
            .catch(() => { window.localStorage.removeItem('token'); window.localStorage.removeItem('user'); })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await authAPI.login({ email, password });
        const { token, user } = res.data;
        window.localStorage.setItem('token', token);
        window.localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    }, []);

    const signup = useCallback(async (data) => {
        const res = await authAPI.signup(data);
        const { token, user } = res.data;
        window.localStorage.setItem('token', token);
        window.localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
    }, []);

    const logout = useCallback(() => {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
        setUser(null);
    }, []);

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};