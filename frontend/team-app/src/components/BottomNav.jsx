// team-app/src/components/BottomNav.jsx
// NEU: Gemeinsame Bottom-Navigation, ersetzt die bisher in jeder Screen-Datei
// einzeln duplizierten <nav>-Blöcke. Vorteile: "Karte"-Link musste nur an
// EINER Stelle ergänzt werden, und die Badge-Anzeige (unreadCount) ist jetzt
// überall konsistent (vorher fehlte sie z. B. in BroadcastsScreen.jsx).
import { Link } from 'react-router-dom';
import { useBroadcasts } from '../context/BroadcastsContext';

export default function BottomNav() {
  const { unreadCount } = useBroadcasts();

  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t bg-white text-xs sm:text-sm">
      <Link to="/stations" className="btn-secondary flex-1 rounded-none border-0">
        Stationen
      </Link>
      <Link to="/karte" className="btn-secondary flex-1 rounded-none border-0">
        Karte
      </Link>
      <Link to="/ermittlungsakte" className="btn-secondary flex-1 rounded-none border-0">
        Akte
      </Link>
      <Link to="/broadcasts" className="btn-secondary relative flex-1 rounded-none border-0">
        Nachrichten
        {unreadCount > 0 && (
          <span className="absolute right-2 top-1 rounded-full bg-accent-500 px-1.5 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </Link>
      <Link to="/leaderboard" className="btn-secondary flex-1 rounded-none border-0">
        Rangliste
      </Link>
    </nav>
  );
}
