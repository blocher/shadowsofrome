// The message protocol shared by worker.js (inside a Web Worker) and client.js (the in-thread fallback).
//
// Public API
//   createHandler(post) -> async (message) => void
//     message: { id, cmd: 'choose' | 'analyse' | 'review' | 'cancel', state: serialize(state), moves?, opts? }
//     replies through post(): { id, result } | { id, progress } | { id, error } (error is a string;
//     'cancelled' when a review was stopped by { id, cmd: 'cancel' }).
//     'cancel' stops the review with the same id (or every running review when sent with id null). A 'choose' or
//     'analyse' runs to completion in one go; to abandon one, terminate the worker (AIClient.cancel does).
import { deserialize } from '../engine/engine.js';
import { chooseMove, analyse } from './search.js';
import { reviewGame } from './review.js';

export function createHandler(post) {
  const cancelled = new Set();
  const running = new Set();
  return async function handle(msg) {
    const { id, cmd } = msg || {};
    if (cmd === 'cancel') {
      if (id === null || id === undefined) for (const r of running) cancelled.add(r); else cancelled.add(id);
      return;
    }
    try {
      const state = deserialize(msg.state);
      const opts = msg.opts || {};
      if (cmd === 'choose') post({ id, result: chooseMove(state, opts) });
      else if (cmd === 'analyse') post({ id, result: analyse(state, opts) });
      else if (cmd === 'review') {
        running.add(id);
        try {
          const result = await reviewGame(state, msg.moves || [], { ...opts, shouldCancel: () => cancelled.has(id) },
            (progress) => post({ id, progress }));
          post({ id, result });
        } finally {
          running.delete(id); cancelled.delete(id);
        }
      } else post({ id, error: `unknown command: ${cmd}` });
    } catch (err) {
      post({ id, error: err && err.name === 'AbortError' ? 'cancelled' : String((err && err.message) || err) });
    }
  };
}
