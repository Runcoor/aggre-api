/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { lazy } from 'react';

// Wraps React.lazy so a transient failure to fetch a code-split chunk does not
// hard-fail into a white screen. Two failure modes are handled:
//   1. Cloudflare 522 / network blip — the origin is momentarily unreachable,
//      so the dynamic import() rejects. We retry a few times with backoff;
//      since 522s are intermittent, a later attempt usually succeeds.
//   2. Stale chunk after a fresh deploy — the open tab references old asset
//      hashes that no longer exist (404). Retries can't fix that, so as a last
//      resort we force a single full page reload to pull a fresh asset manifest.
const RELOAD_FLAG = 'chunkReloadedAt';

export default function lazyWithRetry(factory, retries = 3, delay = 500) {
  return lazy(
    () =>
      new Promise((resolve, reject) => {
        const attempt = (remaining, wait) => {
          factory()
            .then((mod) => {
              try {
                window.sessionStorage.removeItem(RELOAD_FLAG);
              } catch (_) {
                /* ignore storage errors */
              }
              resolve(mod);
            })
            .catch((err) => {
              if (remaining > 0) {
                setTimeout(() => attempt(remaining - 1, wait * 1.6), wait);
                return;
              }
              // Retries exhausted. If we have not reloaded very recently, the
              // chunk hash is probably stale after a deploy — reload once. The
              // timestamp guard prevents an infinite reload loop when the
              // origin is genuinely down.
              let last = 0;
              try {
                last = Number(window.sessionStorage.getItem(RELOAD_FLAG) || 0);
              } catch (_) {
                /* ignore storage errors */
              }
              const now = Date.now();
              if (now - last > 15000) {
                try {
                  window.sessionStorage.setItem(RELOAD_FLAG, String(now));
                } catch (_) {
                  /* ignore storage errors */
                }
                window.location.reload();
                return; // leave the promise pending; the reload takes over
              }
              reject(err);
            });
        };
        attempt(retries, delay);
      }),
  );
}
