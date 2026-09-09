// team-app/src/components/BroadcastBanner.jsx
// Nutzt jetzt den zentralen BroadcastsContext statt eigenem Polling,
// damit Banner und Nachrichtenverlauf denselben Datenstand teilen.
import { useBroadcasts } from '../context/BroadcastsContext';

export default function BroadcastBanner() {
  const { latestUnseen, markAllAsRead } = useBroadcasts();

  if (!latestUnseen) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-50 bg-accent-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-md"
      onClick={markAllAsRead}
    >
      📢 {latestUnseen.message_text}
      <span className="ml-2 underline">Ausblenden</span>
    </div>
  );
}
