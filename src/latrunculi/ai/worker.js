// Module Web Worker for the Latrunculi AI, so the board never freezes while the engine thinks.
//
//   const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });   // Vite-compatible
//   worker.postMessage({ id, cmd: 'choose' | 'analyse' | 'review' | 'cancel', state: serialize(state), moves?, opts });
//   worker.onmessage = ({ data }) => data is { id, result } | { id, progress } | { id, error }
//
// 'choose' -> chooseMove(state, opts); 'analyse' -> analyse(state, opts); 'review' -> reviewGame(state, moves, opts)
// with { id, progress } after every ply; 'cancel' stops the review with that id. See protocol.js for details and
// client.js for a Promise wrapper (AIClient) with an in-thread fallback.
import { createHandler } from './protocol.js';

const scope = typeof self !== 'undefined' ? self : null;
if (scope && typeof scope.postMessage === 'function' && typeof scope.document === 'undefined') {
  const handle = createHandler((message) => scope.postMessage(message));
  scope.onmessage = (event) => { handle(event.data); };
}
