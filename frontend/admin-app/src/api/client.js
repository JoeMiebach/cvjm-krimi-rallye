// Phase E: Foto-Einsendungen lesen und bewerten
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
let authToken = null;
export function setAuthToken(token) { authToken = token; }
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) };
  const response = await fetch(new URL(API_BASE_URL + path).toString(), { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Anfrage fehlgeschlagen');
  return data;
}
export const photoApi = {
  getPhotoSubmissions: (rallyeId) => request(`/admin/photo-submissions.php?rallye_id=${rallyeId}`),
  awardPhotoPoints: (submissionId, points) => request('/admin/photo-submissions/award.php', { method: 'POST', body: JSON.stringify({ submission_id: submissionId, points }) })
};
