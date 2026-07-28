const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: 'http://localhost:3001' });
  const page = await context.newPage();
  
  await page.goto('/login');
  await page.fill('input[type="email"]', 'tenant@navfarm.demo');
  await page.fill('input[type="password"]', 'Demo123!');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);
  console.log('Current URL:', page.url());
  const content = await page.content();
  if (content.includes('Access denied')) {
    console.log('ACCESS DENIED FOUND');
  }
  await browser.close();
})();
