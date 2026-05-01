import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
});

let isRedirectingToLogin = false;

// Attach JWT to every request
api.interceptors.request.use((config) => {
    if (typeof window === "undefined") return config;
    const token = window.localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally - redirect to login
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            if (typeof window !== "undefined") {
                window.localStorage.removeItem("token");
                window.localStorage.removeItem("user");

                // Avoid redirect loops when multiple requests fail at once.
                if (!isRedirectingToLogin && window.location.pathname !== "/login") {
                    isRedirectingToLogin = true;
                    window.location.assign("/login");
                }
            }
        }
        return Promise.reject(err);
    }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
    signup: (data) => api.post("/auth/signup", data),
    login: (data) => api.post("/auth/login", data),
    me: () => api.get("/auth/me"),
    updateProfile: (data) => api.patch("/auth/me", data),
    getUsers: () => api.get("/auth/users"),
    updateRole: (id, role) => api.patch(`/auth/users/${id}/role`, { role }),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsAPI = {
    getAll: () => api.get("/projects"),
    getOne: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post("/projects", data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`),
    addMember: (id, user_id) => api.post(`/projects/${id}/members`, { user_id }),
    removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksAPI = {
    getAll: (params) => api.get("/tasks", { params }),
    getOne: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post("/tasks", data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    getDashboard: () => api.get("/tasks/dashboard"),
};

export default api;
