// team-app/src/api/client.js
// getChat(), respondToChat(), getOpenTasks() (Phase B), getSuspects() (Phase C),
// submitPhoto() (Phase E) ergaenzt. getClues() (altes Ermittlungsakte-System)
// entfernt.
// NEU (Phase F, Ermittler-Chat-System): uploadAvatar() ergaenzt.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    'VITE_API_BASE_URL ist nicht gesetzt. Bitte .env bzw. .env.production anlegen (siehe .env.example).'
  );
}

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function handleResponse(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // leerer Body möglich
  }

  if (response.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new ApiError(401, data?.error || 'Nicht authentifiziert', data);
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error || 'Unbekannter Fehler', data);
  }

  return data;
}

async function request(path, { method = 'GET', body, query } = {}) {
  const url = new URL(API_BASE_URL + path);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (networkError) {
    throw new ApiError(0, 'Netzwerkfehler – bitte Verbindung prüfen.', null);
  }

  return handleResponse(response);
}

// NEU (Phase E): eigener Request-Pfad fuer multipart/form-data-Uploads.
// Bewusst KEIN 'Content-Type'-Header gesetzt -- der Browser ergaenzt
// automatisch die korrekte multipart-Boundary.
async function requestMultipart(path, formData) {
  const url = new URL(API_BASE_URL + path);
  const headers = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData
    });
  } catch (networkError) {
    throw new ApiError(0, 'Netzwerkfehler – bitte Verbindung prüfen.', null);
  }

  return handleResponse(response);
}

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const api = {
  getConfig: (rallyeId) => request('/config.php', { query: { rallye_id: rallyeId } }),
  checkCode: (code) => request('/auth/check-code.php', { method: 'POST', body: { code } }),
  register: (code, teamName) =>
    request('/auth/register.php', { method: 'POST', body: { code, team_name: teamName } }),
  login: (code) => request('/auth/login.php', { method: 'POST', body: { code } }),

  getMe: () => request('/team/me.php'),
  getStations: (rallyeId) => request('/stations.php', { query: { rallye_id: rallyeId } }),
  unlockStation: (stationId, qrCode) =>
    request('/stations/unlock.php', { method: 'POST', body: { station_id: stationId, qr_code: qrCode } }),
  checkGeofence: (latitude, longitude) =>
    request('/team/check-geofence.php', { method: 'POST', body: { latitude, longitude } }),
  getPuzzles: (stationId) => request('/puzzles.php', { query: { station_id: stationId } }),
  requestHint: (puzzleId) => request('/puzzles/hint.php', { method: 'POST', body: { puzzle_id: puzzleId } }),
  submitAnswer: (puzzleId, answer) =>
    request('/puzzles/submit.php', { method: 'POST', body: { puzzle_id: puzzleId, answer } }),
  getProgress: () => request('/team/progress.php'),
  getLeaderboard: (rallyeId) => request('/leaderboard.php', { query: { rallye_id: rallyeId } }),
  getBroadcasts: (since) => request('/team/broadcasts.php', { query: { since } }),

  // Ermittler-Chat-System (Phase B)
  getChat: () => request('/team/chat.php'),
  respondToChat: (nodeId, response) =>
    request('/team/chat/respond.php', { method: 'POST', body: { node_id: nodeId, response } }),
  getOpenTasks: () => request('/team/open-tasks.php'),

  // Ermittler-Chat-System (Phase C)
  getSuspects: () => request('/team/suspects.php'),

  // Ermittler-Chat-System (Phase E)
  submitPhoto: (nodeId, file) => {
    const formData = new FormData();
    formData.append('node_id', nodeId);
    formData.append('photo', file);
    return requestMultipart('/team/photos/submit.php', formData);
  },

  // Ermittler-Chat-System (Phase F)
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return requestMultipart('/team/avatars/upload.php', formData);
  }
};
