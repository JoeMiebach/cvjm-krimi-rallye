import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { api, setAuthToken, setUnauthorizedHandler, ApiError } from '../api/client';

// Der Startcode ist das einzige Re-Login-Geheimnis. Das httpOnly-Cookie
// "team_code" verwaltet der Server; wir speichern den Code zusätzlich lokal,
// weil JS ein httpOnly-Cookie nicht auslesen kann, ihn aber für den
// automatischen login.php-Call beim App-Start brauchen.
const CODE_STORAGE_KEY = 'viking_rallye_team_code';

const initialState = {
  status: 'checking', // checking | loggedOut | needsTeamName | loggedIn
  team: null,
  token: null,
  rallyeId: null, // wird ausschließlich über den Startcode festgelegt (Backend-Antwort)
  pendingCode: null,
  error: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        status: 'loggedIn',
        team: action.team,
        token: action.token,
        rallyeId: action.team?.rallye_id ?? state.rallyeId,
        error: null
      };
    case 'NEEDS_TEAM_NAME':
      return { ...state, status: 'needsTeamName', pendingCode: action.code, error: null };
    case 'LOGGED_OUT':
      return { ...initialState, status: 'loggedOut' };
    case 'ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const logout = useCallback(() => {
    localStorage.removeItem(CODE_STORAGE_KEY);
    setAuthToken(null);
    dispatch({ type: 'LOGGED_OUT' });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // Auto-Login beim App-Start, falls ein Code lokal gespeichert ist.
  useEffect(() => {
    const savedCode = localStorage.getItem(CODE_STORAGE_KEY);
    if (!savedCode) {
      dispatch({ type: 'LOGGED_OUT' });
      return;
    }
    (async () => {
      try {
        const result = await api.login(savedCode);
        setAuthToken(result.token);
        dispatch({ type: 'LOGIN_SUCCESS', team: result.team, token: result.token });
      } catch {
        localStorage.removeItem(CODE_STORAGE_KEY);
        dispatch({ type: 'LOGGED_OUT' });
      }
    })();
  }, []);

  /** Schritt 1: Startcode prüfen. Der Code bestimmt implizit die Rallye. */
  const submitCode = useCallback(async (code) => {
    try {
      const result = await api.checkCode(code);
      if (result.already_registered) {
        const loginResult = await api.login(code);
        setAuthToken(loginResult.token);
        localStorage.setItem(CODE_STORAGE_KEY, code);
        dispatch({ type: 'LOGIN_SUCCESS', team: loginResult.team, token: loginResult.token });
      } else {
        dispatch({ type: 'NEEDS_TEAM_NAME', code });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Verbindung fehlgeschlagen.';
      dispatch({ type: 'ERROR', error: message });
    }
  }, []);

  /** Schritt 2: Teamnamen festlegen (nur bei Erstregistrierung). */
  const submitTeamName = useCallback(async (teamName) => {
    if (!state.pendingCode) return;
    try {
      const result = await api.register(state.pendingCode, teamName);
      setAuthToken(result.token);
      localStorage.setItem(CODE_STORAGE_KEY, state.pendingCode);
      dispatch({ type: 'LOGIN_SUCCESS', team: result.team, token: result.token });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registrierung fehlgeschlagen.';
      dispatch({ type: 'ERROR', error: message });
    }
  }, [state.pendingCode]);

  return (
    <AuthContext.Provider value={{ ...state, submitCode, submitTeamName, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden.');
  return ctx;
}
