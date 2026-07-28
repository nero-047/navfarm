import fs from 'node:fs';
import path from 'node:path';

const webRoot = path.resolve(__dirname, '../..');
const faviconPath = path.join(webRoot, 'public/favicon.ico');

describe('local brand assets', () => {
  it('keeps the verified local brand mark and favicon available', () => {
    expect(fs.existsSync(faviconPath)).toBe(true);
    const icon = fs.readFileSync(faviconPath);
    expect(icon.subarray(0, 4)).toEqual(Buffer.from([0, 0, 1, 0]));
    expect(icon.readUInt16LE(4)).toBeGreaterThanOrEqual(1);
  });

  it('uses local metadata and runtime image paths', () => {
    const layout = fs.readFileSync(path.join(webRoot, 'src/app/layout.tsx'), 'utf8');
    const brand = fs.readFileSync(path.join(webRoot, 'src/components/brand/navfarm-brand.tsx'), 'utf8');
    expect(layout).toContain("icon: '/favicon.ico'");
    expect(layout).not.toMatch(/https?:\/\//);
    expect(brand).toContain('src="/favicon.ico"');
    expect(brand).toContain('alt="NAVFarm icon"');
    expect(brand).not.toMatch(/https?:\/\//);
  });

  it('does not claim the 48px favicon is an Apple touch icon', () => {
    const layout = fs.readFileSync(path.join(webRoot, 'src/app/layout.tsx'), 'utf8');
    expect(layout).not.toMatch(/apple/i);
    expect(fs.existsSync(path.join(webRoot, 'public/apple-icon.png'))).toBe(false);
  });
});
