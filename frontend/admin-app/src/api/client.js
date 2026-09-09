// admin-app/src/api/client.js
// FIX: getPuzzles() ergänzt -- fehlte bisher komplett, dadurch konnte der
// Rätsel-Editor keine bestehenden Rätsel pro Station laden.

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

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
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
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, 'Netzwerkfehler – bitte Verbindung prüfen.', null);
  }

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

  if (response.status === 403) {
    throw new ApiError(403, data?.error || 'Keine Bearbeitungsrechte (Beobachter-Rolle)', data);
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error || 'Unbekannter Fehler', data);
  }

  return data;
}

export const api = {
  // Auth
  adminLogin: (email, password) =>
    request('/auth/admin-login.php', { method: 'POST', body: { email, password } }),

  // Beobachter + Admin (lesend)
  getDashboard: (rallyeId) => request('/admin/dashboard.php', { query: { rallye_id: rallyeId } }),
  getLeaderboard: (rallyeId) => request('/admin/leaderboard.php', { query: { rallye_id: rallyeId } }),
  getPositions: (rallyeId) => request('/admin/positions.php', { query: { rallye_id: rallyeId } }),
  getBroadcasts: (rallyeId) => request('/admin/broadcasts.php', { query: { rallye_id: rallyeId } }),

  // Admin (schreibend)
  getRallyes: () => request('/admin/rallyes.php'),
  createRallye: (payload) => request('/admin/rallyes.php', { method: 'POST', body: payload }),
  updateRallye: (id, payload) => request('/admin/rallyes.php', { method: 'PUT', query: { id }, body: payload }),
  archiveRallye: (id) => request('/admin/rallyes/archive.php', { method: 'POST', body: { id } }),

  generateStartCodes: (rallyeId, count) =>
    request('/admin/start-codes/generate.php', { method: 'POST', body: { rallye_id: rallyeId, count } }),

  getTeams: (rallyeId) => request('/admin/teams.php', { query: { rallye_id: rallyeId } }),
  updateTeam: (id, payload) => request('/admin/teams.php', { method: 'PUT', query: { id }, body: payload }),
  deleteTeam: (id) => request('/admin/teams.php', { method: 'DELETE', query: { id } }),
  resetTeamProgress: (teamId) =>
    request('/admin/teams/reset-progress.php', { method: 'POST', body: { team_id: teamId } }),

  getStations: (rallyeId) => request('/admin/stations.php', { query: { rallye_id: rallyeId } }),
  createStation: (payload) => request('/admin/stations.php', { method: 'POST', body: payload }),
  updateStation: (id, payload) => request('/admin/stations.php', { method: 'PUT', query: { id }, body: payload }),
  deleteStation: (id) => request('/admin/stations.php', { method: 'DELETE', query: { id } }),
  unlockStationForTeam: (stationId, teamId) =>
    request('/admin/stations/unlock-for-team.php', { method: 'POST', body: { station_id: stationId, team_id: teamId } }),

  // NEU: fehlte bisher komplett
  getPuzzles: (stationId) => request('/admin/puzzles.php', { query: { station_id: stationId } }),
  createPuzzle: (payload) => request('/admin/puzzles.php', { method: 'POST', body: payload }),
  updatePuzzle: (id, payload) => request('/admin/puzzles.php', { method: 'PUT', query: { id }, body: payload }),
  deletePuzzle: (id) => request('/admin/puzzles.php', { method: 'DELETE', query: { id } }),

  sendBroadcast: (rallyeId, messageText, targetTeamIds = null) =>
    request('/admin/broadcast.php', {
      method: 'POST',
      body: { rallye_id: rallyeId, message_text: messageText, target_team_ids: targetTeamIds }
    }),

  startGame: (rallyeId) => request('/admin/game/start.php', { method: 'POST', body: { rallye_id: rallyeId } }),
  pauseGame: (rallyeId) => request('/admin/game/pause.php', { method: 'POST', body: { rallye_id: rallyeId } }),
  endGame: (rallyeId) => request('/admin/game/end.php', { method: 'POST', body: { rallye_id: rallyeId } }),
  resetGame: (rallyeId) =>
    request('/admin/game/reset.php', { method: 'POST', body: { rallye_id: rallyeId, confirm: true } })
};
