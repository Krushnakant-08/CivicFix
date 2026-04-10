const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Core fetch wrapper with auth token handling
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('civicfix_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Auth API ────────────────────────────────────────────
export const authAPI = {
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => request('/auth/me'),

  createStaff: (data) =>
    request('/auth/create-staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Users API ───────────────────────────────────────────
export const usersAPI = {
  getAll: (params = '') => request(`/users${params ? `?${params}` : ''}`),
  getById: (id) => request(`/users/${id}`),
  updateProfile: (data) =>
    request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateRole: (id, data) =>
    request(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleStatus: (id) =>
    request(`/users/${id}/status`, {
      method: 'PUT',
    }),
};

// ─── Reports API ─────────────────────────────────────────
export const reportsAPI = {
  create: (data) =>
    request('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (params = '') => request(`/reports${params ? `?${params}` : ''}`),

  getById: (id) => request(`/reports/${id}`),

  track: (trackingId) => request(`/reports/track/${trackingId}`),

  getMyReports: (params = '') =>
    request(`/reports/my/reports${params ? `?${params}` : ''}`),

  updateStatus: (id, data) =>
    request(`/reports/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  assign: (id, data) =>
    request(`/reports/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  upvote: (id) =>
    request(`/reports/${id}/upvote`, {
      method: 'PUT',
    }),

  getStats: () => request('/reports/stats/overview'),

  reanalyze: (id) =>
    request(`/reports/${id}/analyze`, {
      method: 'POST',
    }),
};

// ─── Health Check ────────────────────────────────────────
export const healthCheck = () => request('/health');
