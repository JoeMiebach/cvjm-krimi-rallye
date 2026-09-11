// team-app/src/screens/ChatScreen.jsx
// ... (Zeilen 1-20 unveraendert) ...
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { queueAction, flushQueue } from '../offline/queue';
import PuzzleRefButton from '../components/PuzzleRefButton'; // NEU


const POLL_INTERVAL_MS = 10_000;


// ... (Zeilen 28-115 unveraendert - PhotoUploadForm und ChatBubble bis auf die puzzle_ref-Stelle) ...


// In ChatBubble, bei der puzzle_ref-Stelle (ca. Zeile 120 im Original):
// ERSETZEN:
// {isOpenAnswer && entry.response_type === 'puzzle_ref' && entry.station_id && (
//   <button
//     className="btn-primary text-sm"
//     onClick={() => navigate(`/stations/${entry.station_id}/puzzles`)}
//   >
//     🔍 Raetsel oeffnen
//   </button>
// )}
//
// DURCH:
// {isOpenAnswer && entry.response_type === 'puzzle_ref' && entry.station_id && (
//   <PuzzleRefButton
//     stationId={entry.station_id}
//     puzzleId={entry.puzzle_id}
//     onClick={() => navigate(`/stations/${entry.station_id}/puzzles`)}
//   />
// )}


// ... (Rest der Datei unveraendert) ...
