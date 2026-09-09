// admin-app/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { api, setAuthToken, setUnauthorizedHandler, ApiError } from '../api/client';

const TOKEN_STORAGE_KEY = 'viking_rallye_admin_token';

const initialState = {
  status: 'checking', // checking | loggedOut | loggedIn
  admin: null,
  token: null,
  role: null, // 'admin' | 'viewer'
  error: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, status: 'loggedIn', admin: action.admin, token: action.token, role: action.role, error: null };
    case 'LOGGED_OUT':
      return { ...initialState, status: 'loggedOut' };
    case 'ERROR':
      return { ...state, error: action.error };
    default:
      return state;
  }
}

/** Token-Payload ist Base64-kodiert vor dem Punkt (HMAC-Token, siehe Backend-Spec). */
function decodeTokenPayload(token) {
  try {
    const [payloadEncoded] = token.split('.');
    return JSON.parse(atob(payloadEncoded));
  } catch {
    return null;
  }
}

function isTokenExpired(payload) {
  if (!payload?.exp) return false; // kein exp-Feld -> keine clientseitige Prüfung möglich
  return Date.now() >= payload.exp * 1000;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    dispatch({ type: 'LOGGED_OUT' });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!savedToken) {
      dispatch({ type: 'LOGGED_OUT' });
      return;
    }
    const payload = decodeTokenPayload(savedToken);
    if (!payload || isTokenExpired(payload)) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      dispatch({ type: 'LOGGED_OUT' });
      return;
    }
    setAuthToken(savedToken);
    dispatch({
      type: 'LOGIN_SUCCESS',
      admin: { id: payload.admin_id, name: payload.name },
      token: savedToken,
      role: payload.role
    });
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const result = await api.adminLogin(email, password);
      setAuthToken(result.token);
      localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
      dispatch({ type: 'LOGIN_SUCCESS', admin: result.admin, token: result.token, role: result.admin.role });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Anmeldung fehlgeschlagen.';
      dispatch({ type: 'ERROR', error: message });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAdmin: state.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden.');
  return ctx;
}
