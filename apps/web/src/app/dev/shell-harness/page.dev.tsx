import { notFound } from "next/navigation";
import { ShellHarness } from "./harness";

/**
 * Fixture route for the shell geometry browser tests.
 *
 * The real console routes prove the shell in situ, but their content height,
 * permissions and API state vary; this route pins the two cases the geometry
 * has to survive — very long content, and a very long contextual navigation
 * column — so the assertions mean the same thing in every browser.
 *
 * The `.dev.tsx` suffix is what keeps this out of production: `dev.tsx` is only
 * a configured `pageExtensions` entry under the development-server phase (see
 * `next.config.js`), so `next build` does not treat this file as a page and the
 * route is absent from the production manifest. The `notFound()` below is
 * belt-and-braces for a dev server started with NODE_ENV=production.
 */
export default async function ShellHarnessPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { context } = await searchParams;
  return <ShellHarness withContextNav={context === "1"} />;
}
