// team-app/src/screens/BroadcastsScreen.jsx
// v2: Nutzt jetzt <BottomNav /> statt eigenem <nav>-Block (der bisher sogar
// das unreadCount-Badge vergessen hatte, das die anderen Screens schon hatten).
import { useEffect } from 'react';
import { useBroadcasts } from '../context/BroadcastsContext';
import BottomNav from '../components/BottomNav';

export default function BroadcastsScreen() {
  const { messages, markAllAsRead } = useBroadcasts();

  useEffect(() => {
    markAllAsRead();
  }, []);

  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-4 text-xl font-bold text-primary-700">Nachrichten vom Spielleiter</h1>

      {messages.length === 0 && (
        <p className="card text-ink/60">Bisher wurden noch keine Nachrichten gesendet.</p>
      )}

      <div className="space-y-3">
        {[...messages].reverse().map((msg, index) => (
          <div key={msg.id ?? index} className="card">
            <p>{msg.message_text}</p>
            {msg.created_at && (
              <p className="mt-1 text-xs text-ink/50">
                {new Date(msg.created_at).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
