import { LIVESTOCK_SECTIONS } from '../src/components/console/livestock/livestock-page-shell';

/**
 * These hrefs are sidebar destinations, not API paths. They were once rewritten
 * by a find-and-replace aimed at the breeding API route (@Controller
 * 'piggery/breeding'), which silently pointed a nav item at a page that does
 * not exist — and, because the href left the nav set, handed the highlight to
 * the shorter /livestock entry instead.
 */
describe('LIVESTOCK_SECTIONS', () => {
  it('points every section at a real livestock page route', () => {
    for (const section of LIVESTOCK_SECTIONS) {
      expect(section.href.startsWith('/livestock')).toBe(true);
    }
  });

  it('gives the register the module root and every other section a distinct sub-route', () => {
    const hrefs = LIVESTOCK_SECTIONS.map((s) => s.href);

    expect(hrefs).toContain('/livestock');
    expect(hrefs).toContain('/livestock/breeding');
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
