import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { RallyeProvider, useRallye } from './context/RallyeContext';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import RallyesScreen from './screens/RallyesScreen';
import TeamsScreen from './screens/TeamsScreen';
import TeamMonitorScreen from './screens/TeamMonitorScreen';
import StationsEditorScreen from './screens/StationsEditorScreen';
import PuzzlesEditorScreen from './screens/PuzzlesEditorScreen';
import StoryNodesEditorScreen from './screens/StoryNodesEditorScreen';
import SuspectsEditorScreen from './screens/SuspectsEditorScreen';
import PhotoSubmissionsScreen from './screens/PhotoSubmissionsScreen';
import BroadcastsScreen from './screens/BroadcastsScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import MapScreen from './screens/MapScreen';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { status, isAdmin } = useAuth();
  if (status === 'checking') {
    return <div className="flex min-h-screen items-center justify-center text-primary-700">Lade...</div>;
  }
  if (status !== 'loggedIn') return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function RallyeSelect() {
  const { rallyes, rallyeId, setRallyeId, status } = useRallye();
  if (status === 'loading') return <span className="text-sm text-ink/60">Lade Rallyes...</span>;
  if (status === 'error') return <span className="text-sm text-red-600">Rallyes konnten nicht geladen werden</span>;
  if (rallyes.length === 0) return <span className="text-sm text-ink/60">Keine Rallye angelegt</span>;
  return (
    <select className="input-field text-sm" value={rallyeId ?? ''} onChange={(e) => setRallyeId(Number(e.target.value))}>
      {rallyes.map((r) => <option key={r.id} value={r.id}>{r.name}{r.is_archived ? ' (archiviert)' : ''}</option>)}
    </select>
  );
}

function AppShell({ children }) {
  const { admin, role, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout() {
    logout();
    navigate('/login');
  }
  return (
    <RallyeProvider>
      <div className="min-h-screen bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-white px-4 py-3">
          <nav className="flex flex-wrap gap-3 text-sm font-medium text-primary-700">
            <Link to="/dashboard">Dashboard</Link><Link to="/rallyes">Rallyes</Link><Link to="/teams">Teams</Link>
            <Link to="/stations">Stationen</Link><Link to="/puzzles">Rätsel</Link><Link to="/story-nodes">Chat-Knoten</Link>
            <Link to="/suspects">Verdächtige</Link><Link to="/photo-submissions">Fotos</Link><Link to="/broadcasts">Broadcasts</Link>
            <Link to="/leaderboard">Rangliste</Link><Link to="/map">Karte</Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <RallyeSelect />
            <span className="text-ink/60">{admin?.name} ({role})</span>
            <button className="btn-secondary" onClick={handleLogout}>Abmelden</button>
          </div>
        </header>
        <main className="p-4">{children}</main>
      </div>
    </RallyeProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/dashboard" element={<ProtectedRoute><AppShell><DashboardScreen /></AppShell></ProtectedRoute>} />
      <Route path="/rallyes" element={<ProtectedRoute requireAdmin><AppShell><RallyesScreen /></AppShell></ProtectedRoute>} />
      <Route path="/teams" element={<ProtectedRoute requireAdmin><AppShell><TeamsScreen /></AppShell></ProtectedRoute>} />
      <Route path="/team-monitor/:teamId" element={<ProtectedRoute requireAdmin><AppShell><TeamMonitorScreen /></AppShell></ProtectedRoute>} />
      <Route path="/stations" element={<ProtectedRoute requireAdmin><AppShell><StationsEditorScreen /></AppShell></ProtectedRoute>} />
      <Route path="/puzzles" element={<ProtectedRoute requireAdmin><AppShell><PuzzlesEditorScreen /></AppShell></ProtectedRoute>} />
      <Route path="/story-nodes" element={<ProtectedRoute requireAdmin><AppShell><StoryNodesEditorScreen /></AppShell></ProtectedRoute>} />
      <Route path="/suspects" element={<ProtectedRoute requireAdmin><AppShell><SuspectsEditorScreen /></AppShell></ProtectedRoute>} />
      <Route path="/photo-submissions" element={<ProtectedRoute requireAdmin><AppShell><PhotoSubmissionsScreen /></AppShell></ProtectedRoute>} />
      <Route path="/broadcasts" element={<ProtectedRoute requireAdmin><AppShell><BroadcastsScreen /></AppShell></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><AppShell><LeaderboardScreen /></AppShell></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><AppShell><MapScreen /></AppShell></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
