// team-app/src/App.jsx
// v4: Route für die neue Stationskarte (StationsMapScreen) ergänzt.
// WICHTIG: Ein Navigations-Link zu "/karte" fehlt hier noch -- ich kenne
// eure Bottom-Nav/Menü-Komponente nicht (nicht in den bisher gesehenen
// Dateien enthalten). Bitte dort manuell einen Link auf "/karte" ergänzen,
// oder schick mir die Nav-Komponente, dann mache ich das passend dazu.
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { GameStatusProvider } from './context/GameStatusContext';
import StartScreen from './screens/StartScreen';
import StationsScreen from './screens/StationsScreen';
import StationDetailScreen from './screens/StationDetailScreen';
import StationsMapScreen from './screens/StationsMapScreen';
import PuzzlesScreen from './screens/PuzzlesScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import BroadcastsScreen from './screens/BroadcastsScreen';
import CaseFileScreen from './screens/CaseFileScreen';
import BroadcastBanner from './components/BroadcastBanner';
import GeofenceStatus from './components/GeofenceStatus';
import GameStatusBanner from './components/GameStatusBanner';

function ProtectedRoute({ children }) {
  const { status } = useAuth();
  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center text-primary-700">
        Lade...
      </div>
    );
  }
  if (status !== 'loggedIn') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <GameStatusProvider>
      <div className="min-h-screen">
        <BroadcastBanner />
        <GeofenceStatus />
        <GameStatusBanner />
        <Routes>
          <Route path="/" element={<StartScreen />} />
          <Route
            path="/stations"
            element={
              <ProtectedRoute>
                <StationsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stations/:id"
            element={
              <ProtectedRoute>
                <StationDetailScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stations/:id/puzzles"
            element={
              <ProtectedRoute>
                <PuzzlesScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/karte"
            element={
              <ProtectedRoute>
                <StationsMapScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ermittlungsakte"
            element={
              <ProtectedRoute>
                <CaseFileScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/broadcasts"
            element={
              <ProtectedRoute>
                <BroadcastsScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardScreen />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </GameStatusProvider>
  );
}
