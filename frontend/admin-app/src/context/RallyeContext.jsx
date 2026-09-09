// admin-app/src/context/RallyeContext.jsx
// NEU (09.09.2026): Ersetzt die feste VITE_DEFAULT_RALLYE_ID durch eine im
// Admin-UI waehlbare Rallye. Persistiert die Auswahl in localStorage, damit
// sie einen Reload uebersteht. Faellt auf die erste nicht-archivierte Rallye
// zurueck, falls die gespeicherte ID nicht mehr existiert (z.B. archiviert
// oder geloescht). Siehe 00_Project_Brief_Entscheidungslog_v3.md, Punkt 15.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

const RALLYE_STORAGE_KEY = 'viking_rallye_admin_selected_rallye';

const RallyeContext = createContext(null);

export function RallyeProvider({ children }) {
  const [rallyes, setRallyes] = useState([]);
  const [rallyeId, setRallyeIdState] = useState(() => {
    const saved = localStorage.getItem(RALLYE_STORAGE_KEY);
    return saved ? Number(saved) : null;
  });
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const setRallyeId = useCallback((id) => {
    setRallyeIdState(id);
    localStorage.setItem(RALLYE_STORAGE_KEY, String(id));
  }, []);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await api.getRallyes();
      const list = result.rallyes || [];
      setRallyes(list);
      setRallyeIdState((current) => {
        const stillExists = list.some((r) => r.id === current);
        if (stillExists) return current;
        const firstActive = list.find((r) => !r.is_archived) || list[0];
        const fallbackId = firstActive ? firstActive.id : null;
        if (fallbackId !== null) localStorage.setItem(RALLYE_STORAGE_KEY, String(fallbackId));
        return fallbackId;
      });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <RallyeContext.Provider value={{ rallyes, rallyeId, setRallyeId, status, reload }}>
      {children}
    </RallyeContext.Provider>
  );
}

export function useRallye() {
  const ctx = useContext(RallyeContext);
  if (!ctx) throw new Error('useRallye muss innerhalb von <RallyeProvider> verwendet werden.');
  return ctx;
}
