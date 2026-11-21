// Promise wrapper around the AI worker, with an automatic in-thread fallback when Web Workers are unavailable
// (tests, old browsers, a worker that fails to load).
//
// Public API
//   const ai = new AIClient({ worker?: boolean = true })
//   ai.choose(state, opts)                          -> Promise<{ move, score, depth, nodes, ms, pv, lapse }>
//   ai.analyse(state, opts)                         -> Promise<{ score, depth, nodes, ms, lines }>
//   ai.review(startState, moves, opts, onProgress)  -> Promise<review>   (see review.js; onProgress per ply)
//   ai.cancel()    reject everything pending with an Error named 'AbortError' and stop the work (the worker is
//                  terminated and restarted lazily; in the fallback a running review stops at the next ply)
//   ai.dispose()   cancel, release the worker; the client cannot be used afterwards
//   ai.mode        'worker' | 'thread' (which path the last request used)
// `state` is an engine state; it is serialised for the worker. opts are those of chooseMove / analyse /
// reviewGame (functions in opts are dropped: use `names`, `depth`, `timeMs`, `maxNodes` ...).
import { serialize } from '../engine/engine.js';
import { createHandler } from './protocol.js';

function abortError() {
  const e = new Error('cancelled');
  e.name = 'AbortError';
  return e;
}
function plain(opts) {
  if (!opts) return {};
  const out = {};
  for (const k in opts) if (typeof opts[k] !== 'function') out[k] = opts[k];
  return out;
}

export class AIClient {
  constructor(options = {}) {
    this.useWorker = options.worker !== false && typeof Worker !== 'undefined';
    this.mode = this.useWorker ? 'worker' : 'thread';
    this.worker = null;
    this.local = null;         // in-thread handler
    this.pending = new Map();  // id -> { resolve, reject, onProgress, message }
    this.nextId = 1;
    this.disposed = false;
  }

  choose(state, opts) { return this.#request('choose', state, null, opts, null); }
  analyse(state, opts) { return this.#request('analyse', state, null, opts, null); }
  review(startState, moves, opts, onProgress) { return this.#request('review', startState, moves, opts, onProgress); }

  cancel() {
    const err = abortError();
    for (const p of this.pending.values()) p.reject(err);
    this.pending.clear();
    if (this.worker) { this.worker.terminate(); this.worker = null; }
    if (this.local) this.local({ id: null, cmd: 'cancel' });
  }

  dispose() {
    this.cancel();
    this.disposed = true;
  }

  #request(cmd, state, moves, opts, onProgress) {
    if (this.disposed) return Promise.reject(new Error('AIClient was disposed'));
    const id = this.nextId++;
    const message = { id, cmd, state: serialize(state), opts: plain(opts) };
    if (moves) message.moves = moves.map((m) => ({ ...m }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onProgress, message });
      this.#send(message);
    });
  }

  #send(message) {
    if (this.useWorker) {
      try {
        this.#ensureWorker().postMessage(message);
        this.mode = 'worker';
        return;
      } catch (err) {
        this.#fallBack();
        return; // #fallBack re-sends everything pending, including this message
      }
    }
    this.#sendLocal(message);
  }

  #sendLocal(message) {
    this.mode = 'thread';
    if (!this.local) this.local = createHandler((reply) => this.#receive(reply));
    // Off the current call stack, so the caller gets its Promise (and can paint) before the engine starts.
    setTimeout(() => { if (this.pending.has(message.id)) this.local(message); }, 0);
  }

  #ensureWorker() {
    if (this.worker) return this.worker;
    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => this.#receive(event.data);
    worker.onerror = (event) => {
      if (event && event.preventDefault) event.preventDefault();
      if (this.worker === worker) this.#fallBack();
    };
    this.worker = worker;
    return worker;
  }

  /** The worker could not be used: run everything still pending in this thread instead. */
  #fallBack() {
    this.useWorker = false;
    if (this.worker) { try { this.worker.terminate(); } catch (err) { /* already gone */ } this.worker = null; }
    for (const p of this.pending.values()) this.#sendLocal(p.message);
  }

  #receive(reply) {
    const p = this.pending.get(reply && reply.id);
    if (!p) return;
    if ('progress' in reply) { if (p.onProgress) p.onProgress(reply.progress); return; }
    this.pending.delete(reply.id);
    if ('error' in reply) p.reject(reply.error === 'cancelled' ? abortError() : new Error(reply.error));
    else p.resolve(reply.result);
  }
}
