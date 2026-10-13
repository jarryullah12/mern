// Central API client for the movie-theater backend.
//
// Base URL resolution:
//   - locally: REACT_APP_API_URL from .env (default http://localhost:4000/api)
//   - in production without the var set: same-domain "/api"
//
// The value is normalised so that both "https://host" and "https://host/api"
// work — if the trailing "/api" is missing it is added automatically.
const rawBase = (
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:4000/api')
).replace(/\/+$/, '');

export const API_URL = /\/api$/.test(rawBase) ? rawBase : `${rawBase}/api`;

// ---- token helpers -------------------------------------------------
export const getToken = () => localStorage.getItem('token');
export const getAdminToken = () => localStorage.getItem('adminToken');

// ---- low-level request ---------------------------------------------
async function request(path, { method = 'GET', body, auth } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth === 'admin') {
    const t = getAdminToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  } else if (auth === 'user') {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    const message = (data && data.message) || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: (path, auth) => request(path, { auth }),
  post: (path, body, auth) => request(path, { method: 'POST', body, auth }),
  put: (path, body, auth) => request(path, { method: 'PUT', body, auth }),
  del: (path, auth) => request(path, { method: 'DELETE', auth }),
};

// ---- movies --------------------------------------------------------
export const fetchFeaturedMovies = () => api.get('/movies/featured');
export const fetchLatestMovies = () => api.get('/movies/latest');
export const fetchComingSoonMovies = () => api.get('/movies/coming-soon');
export const fetchAllMovies = () => api.get('/movies');
export const fetchMovieById = (id) => api.get(`/movies/${id}`);

// ---- user auth -----------------------------------------------------
export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });
export const registerUser = (payload) => api.post('/auth/register', payload);
export const fetchCurrentUser = () => api.get('/auth/me', 'user');

// ---- admin auth ----------------------------------------------------
export const adminLoginRequest = (email, password) =>
  api.post('/admin/login', { email, password });
export const adminRegisterRequest = (payload) => api.post('/admin/register', payload);

// ---- admin data ----------------------------------------------------
export const fetchAdminStats = () => api.get('/admin/stats', 'admin');
export const fetchAdminUsers = () => api.get('/admin/users', 'admin');
export const createAdminUser = (payload) => api.post('/admin/users', payload, 'admin');
export const updateAdminUser = (id, payload) => api.put(`/admin/users/${id}`, payload, 'admin');
export const deleteAdminUser = (id) => api.del(`/admin/users/${id}`, 'admin');
export const fetchAdminBookings = () => api.get('/admin/bookings', 'admin');
export const fetchAdminMessages = () => api.get('/admin/messages', 'admin');

// ---- bookings / contact -------------------------------------------
export const createBooking = (payload) => api.post('/bookings', payload, 'user');
export const fetchMyBookings = () => api.get('/bookings/mine', 'user');
export const sendContactMessage = (payload) => api.post('/contact', payload);

// ---- admin movie writes -------------------------------------------
export const createMovie = (payload) => api.post('/movies', payload, 'admin');
export const updateMovie = (id, payload) => api.put(`/movies/${id}`, payload, 'admin');
export const deleteMovie = (id) => api.del(`/movies/${id}`, 'admin');
export const addMovieTrailer = (id, trailer) =>
  api.post(`/movies/${id}/trailers`, trailer, 'admin');
