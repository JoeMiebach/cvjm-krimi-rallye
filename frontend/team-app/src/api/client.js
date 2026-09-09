// Phase E: Foto-Upload als multipart/form-data
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
let authToken = null;
export function setAuthToken(token) { authToken = token; }
async function multipart(path, formData) {
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const response = await fetch(new URL(API_BASE_URL + path).toString(), { method: 'POST', headers, credentials: 'include', body: formData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Upload fehlgeschlagen');
  return data;
}
export const photoApi = {
  submitPhoto: (nodeId, file) => { const formData = new FormData(); formData.append('node_id', nodeId); formData.append('photo', file); return multipart('/team/photos/submit.php', formData); }
};
