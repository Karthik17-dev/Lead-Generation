import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// The emoji picker (components/ui/emoji-picker.tsx) is built on frimousse, which
// fetches the emojibase dataset in the browser the first time the picker opens.
// Left at its default it fetches from `https://cdn.jsdelivr.net/npm/emojibase-data`
// — a third-party CDN, at runtime, in the user's browser. Zed ships
// self-hosted, and frimousse has no error slot: it exposes `Loading` and
// `Empty`, its cold-cache load path does not catch, and a first open with the
// CDN unreachable leaves the popover spinning forever with no message. So an
import { fileURLToPath } from 'node:url';

// The emoji picker in `components/ui/emoji-picker/` loads its catalog from
// `@interact-io/emojibase-data-en`. In a production bundle, bundlers can't
// trace that dependency reliably across the client/server split, so the browser
// hits 404s when fetching the locale JSONs.
//
// Copying the JSON datasets into `public/emojibase/en/` lets the picker fetch
// them at predictable, origin-qualified URLs in both dev and prod.
//
// Single source of truth for the copy: both the CLI entry point
// (scripts/copy-emojibase-data.mjs, prefixed onto `dev`/`build` in package.json)
// and next.config.ts (belt-and-suspenders for direct `next dev`/`next build`
// invocations) call this module.
export const EMOJIBASE_DATA_ASSETS = [
  {
    from: '../node_modules/emojibase-data/en/data.json',
    to: '../public/emojibase/en/data.json',
    /** Where the browser asks for it: `${emojibaseUrl}/${locale}/${file}`. */
    url: '/emojibase/en/data.json',
  },
  {
    from: '../node_modules/emojibase-data/en/messages.json',
    to: '../public/emojibase/en/messages.json',
    url: '/emojibase/en/messages.json',
  },
];

function resolve(relativePath) {
  return fileURLToPath(new URL(relativePath, import.meta.url));
}

/** Absolute paths of the installed dataset files the copy reads. */
export function getEmojibaseDataSourcePaths() {
  return EMOJIBASE_DATA_ASSETS.map((asset) => resolve(asset.from));
}

/** Absolute paths of the `public/` files the emoji picker requires at runtime. */
export function getEmojibaseDataOutputPaths() {
  return EMOJIBASE_DATA_ASSETS.map((asset) => resolve(asset.to));
}

/**
 * Copy the `en` emojibase dataset from node_modules into `public/`.
 * Returns the copied assets (with resolved absolute paths) on success.
 *
 * Throws if any source file is missing — e.g. a slim prod image that ships
 * `public/` but not the node_modules the dataset comes from. Callers decide
 * whether that's fatal (see next.config.ts, which tolerates it when `public/`
 * already has the outputs baked in from build time).
 */
export function copyEmojibaseData() {
  const copied = [];
  for (const asset of EMOJIBASE_DATA_ASSETS) {
    const src = resolve(asset.from);
    const out = resolve(asset.to);
    mkdirSync(dirname(out), { recursive: true });
    copyFileSync(src, out);
    copied.push({ from: asset.from, to: asset.to, url: asset.url, src, out });
  }
  return copied;
}
