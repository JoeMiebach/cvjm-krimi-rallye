// team-app/src/App.jsx
// v4: Route für die Stationskarte (StationsMapScreen) ergänzt.
// GEAENDERT (Phase B, Ermittler-Chat-System): Route "/ermittlungsakte"
// (CaseFileScreen) entfernt -- vollstaendig abgeloest durch "/chat"
// (ChatScreen) und "/open-tasks" (OpenTasksScreen), siehe
// 05_Technische_Spezifikation_Ermittler_Chat_v1.md.
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
import ChatScreen from './screens/ChatScreen';
import OpenTasksScreen from './screens/OpenTasksScreen';
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
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/open-tasks"
            element={
              <ProtectedRoute>
                <OpenTasksScreen />
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
