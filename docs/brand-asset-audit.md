# NAVFarm brand asset audit

## Verified local assets

- `apps/web/public/favicon.ico` is a valid multi-image Windows icon containing
  48×48 and 32×32 variants.
- The icon is loaded from `/favicon.ico` for browser metadata, login branding,
  and the application sidebar. No branding view requires an external CDN.
- The sidebar uses the mark directly on navy without an artificial white box.
  The NAVFarm wordmark remains visible only where the available width keeps it
  readable.

## Source limitations

- No official NAVFarm SVG or standalone complete-wordmark file is present in
  the supplied repository. SVG validation is therefore not applicable to the
  current official asset set. An official SVG should be supplied before an SVG
  wordmark is introduced; the demo does not redraw or invent one.
- The largest verified favicon variant is 48×48. It is retained as the browser
  favicon and is not duplicated or upscaled as `apple-icon.png`.
- A higher-resolution official square icon of at least 180×180 is required
  before Apple touch-icon metadata can be added.

## Runtime checks

Automated tests verify that the local icon exists, has a valid ICO header,
metadata uses local paths, the rendered image has alternative text, and the
browser reports a non-zero natural image width. Focused Playwright evidence
also checks page overflow and confirms that protected access-state behaviour
remains unchanged.
