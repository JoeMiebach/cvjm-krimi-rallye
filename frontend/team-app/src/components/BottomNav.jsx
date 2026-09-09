// team-app/src/components/BottomNav.jsx
// Gemeinsame Bottom-Navigation.
// GEAENDERT (Phase B, Ermittler-Chat-System): Link "Akte" (/ermittlungsakte)
// ersetzt durch "Chat" (/chat); neuer Link "Aufgaben" (/open-tasks) ergaenzt.
// HINWEIS: Damit sind es jetzt 6 Nav-Items auf einer mobilen Bottom-Nav --
// bei Gelegenheit pruefen, ob das auf 375px-Viewports noch gut lesbar ist,
// ggf. "Aufgaben" spaeter in den Chat-Header statt in die Bottom-Nav verschieben.
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
      <Link to="/chat" className="btn-secondary flex-1 rounded-none border-0">
        Chat
      </Link>
      <Link to="/open-tasks" className="btn-secondary flex-1 rounded-none border-0">
        Aufgaben
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
