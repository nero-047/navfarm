//@ts-check

const { join } = require('path');
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/** Page file extensions Next.js recognises as routes. Next's default list. */
const PRODUCTION_PAGE_EXTENSIONS = ['tsx', 'ts', 'jsx', 'js'];

/**
 * Dev-only routes are named `*.dev.tsx` (e.g. `dev/shell-harness/page.dev.tsx`).
 * That suffix is only a page extension under the development-server phase, so
 * the App Router discovers those files when running `next dev` and does not see
 * them as pages at all during `next build`. The harness therefore keeps its
 * real URL for local work and the Playwright suite, while being absent from the
 * production route manifest rather than merely 404-ing at request time.
 */
const DEVELOPMENT_PAGE_EXTENSIONS = [...PRODUCTION_PAGE_EXTENSIONS, 'dev.tsx'];

/**
 * @param {string} phase
 * @returns {import('next').NextConfig}
 */
module.exports = (phase) => ({
  turbopack: {
    root: join(__dirname, '../..'),
  },
  pageExtensions:
    phase === PHASE_DEVELOPMENT_SERVER
      ? DEVELOPMENT_PAGE_EXTENSIONS
      : PRODUCTION_PAGE_EXTENSIONS,
});
