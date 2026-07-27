
const API_BASE_URL = 'https://hp-5g1i.onrender.com/api';

const Auth = {
  saveSession(data) {
    localStorage.setItem('crps_token', data.token);
    localStorage.setItem('crps_user', JSON.stringify(data));
  },
  getToken() {
    return localStorage.getItem('crps_token');
  },
  getUser() {
    const raw = localStorage.getItem('crps_user');
    return raw ? JSON.parse(raw) : null;
  },
  logout() {
    localStorage.removeItem('crps_token');
    localStorage.removeItem('crps_user');
    window.location.href = 'index.html';
  },
  requireRole(role) {
    const user = this.getUser();
    if (!user || !this.getToken()) {
      window.location.href = 'index.html';
      return null;
    }
    if (role && user.role !== role) {
      alert('You do not have access to that page.');
      window.location.href = 'index.html';
      return null;
    }
    return user;
  }
};

// Wraps fetch(): attaches the JWT, the JSON content-type, and
// throws a readable Error when the server responds with an error status.
async function apiRequest(path, { method = 'GET', body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}
