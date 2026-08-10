# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gl-mapping.spec.ts >> GL Mapping create form shows the full transaction type list
- Location: ../../../../../private/tmp/claude-501/-Users-arunpratapsingh-Desktop-New-Navfarm/00dcf7d3-4f8a-40e5-b15c-a6209c0da413/scratchpad/tests/gl-mapping.spec.ts:3:5

# Error details

```
Test timeout of 25000ms exceeded.
```

```
Error: locator.click: Test timeout of 25000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'GL Mappings' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - banner [ref=e13]:
      - generic [ref=e14]: NAVFarm
      - generic [ref=e15]: Company Setup
      - generic [ref=e16]:
        - button "Switch to dark theme" [ref=e17] [cursor=pointer]:
          - img [ref=e18]
        - button "Sign out" [ref=e20] [cursor=pointer]:
          - img [ref=e21]
          - generic [ref=e24]: Sign Out
    - generic [ref=e25]:
      - complementary [ref=e26]:
        - generic [ref=e27]:
          - heading "ERP Setup Wizard" [level=3] [ref=e28]
          - paragraph [ref=e29]: Configure your company settings to activate agricultural management.
        - button "Company Profile" [ref=e30] [cursor=pointer]:
          - generic [ref=e31]:
            - img [ref=e32]
            - generic [ref=e36]: Company Profile
          - img [ref=e37]
        - button "Operating Addresses" [ref=e39] [cursor=pointer]:
          - generic [ref=e40]:
            - img [ref=e41]
            - generic [ref=e44]: Operating Addresses
        - button "Primary Contact" [disabled] [ref=e45]:
          - generic [ref=e46]:
            - img [ref=e47]
            - generic [ref=e51]: Primary Contact
        - button "Language Catalog" [disabled] [ref=e52]:
          - generic [ref=e53]:
            - img [ref=e54]
            - generic [ref=e57]: Language Catalog
        - button "Base Currency" [disabled] [ref=e58]:
          - generic [ref=e59]:
            - img [ref=e60]
            - generic [ref=e65]: Base Currency
        - button "Timezone & Country" [disabled] [ref=e66]:
          - generic [ref=e67]:
            - img [ref=e68]
            - generic [ref=e71]: Timezone & Country
        - button "Fiscal Accounting" [disabled] [ref=e72]:
          - generic [ref=e73]:
            - img [ref=e74]
            - generic [ref=e76]: Fiscal Accounting
        - button "Nature of Business" [disabled] [ref=e77]:
          - generic [ref=e78]:
            - img [ref=e79]
            - generic [ref=e83]: Nature of Business
        - button "Complete Wizard" [disabled] [ref=e84]:
          - generic [ref=e85]:
            - img [ref=e86]
            - generic [ref=e89]: Complete Wizard
      - main [ref=e90]:
        - generic [ref=e92]:
          - generic [ref=e93]:
            - 'heading "Step 2: Operating Addresses" [level=2] [ref=e94]':
              - img [ref=e95]
              - text: "Step 2: Operating Addresses"
            - paragraph [ref=e98]: Provide operating physical addresses for billing and tax allocations.
          - generic [ref=e99]:
            - generic [ref=e100]:
              - generic [ref=e101]: Address Tag / Label
              - textbox "e.g. Head Office - Gate 1" [ref=e103]
            - generic [ref=e104]:
              - generic [ref=e105]: Street Address line 1
              - textbox "Main Farm Gate Road" [ref=e107]
            - generic [ref=e108]:
              - generic [ref=e109]: Street Address line 2
              - textbox "Shed Area 4" [ref=e111]
            - generic [ref=e112]:
              - generic [ref=e113]: City
              - textbox "Gurugram" [ref=e115]
            - generic [ref=e116]:
              - generic [ref=e117]: State / Province
              - textbox "Haryana" [ref=e119]
            - generic [ref=e120]:
              - generic [ref=e121]: Postal Code
              - textbox "122001" [ref=e123]
            - generic [ref=e124]:
              - generic [ref=e125]: Location Type
              - combobox [ref=e126] [cursor=pointer]:
                - option "Head Office" [selected]
                - option "Farm Location"
                - option "Warehouse"
          - button "Save & Continue" [ref=e127] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("GL Mapping create form shows the full transaction type list", async ({ page }) => {
  4  |   await page.goto("/login");
  5  |   await page.getByLabel(/email/i).fill("admin@glmapfix.local");
  6  |   await page.getByLabel(/password/i).fill("Test@1234");
  7  |   await page.getByRole("button", { name: /sign in|log in|login/i }).click();
  8  |   await page.waitForURL(/console/, { timeout: 15000 });
  9  | 
  10 |   await page.goto("/console/master-data");
> 11 |   await page.getByRole("button", { name: "GL Mappings" }).click();
     |                                                           ^ Error: locator.click: Test timeout of 25000ms exceeded.
  12 |   await page.waitForTimeout(500);
  13 |   await page.getByRole("button", { name: /new|add|create/i }).first().click();
  14 |   await page.waitForTimeout(500);
  15 | 
  16 |   const dialog = page.getByRole("dialog");
  17 |   await expect(dialog).toBeVisible();
  18 |   const select = dialog.locator("select").filter({ hasText: "Purchase" });
  19 |   const optionCount = await select.locator("option").count();
  20 |   console.log("Transaction type option count:", optionCount);
  21 |   const optionTexts = await select.locator("option").allTextContents();
  22 |   console.log("Options:", JSON.stringify(optionTexts));
  23 | 
  24 |   await page.screenshot({ path: "screenshots/gl-mapping-create-light.png", fullPage: true });
  25 |   await page.evaluate(() => { document.documentElement.setAttribute("data-theme", "dark"); });
  26 |   await page.waitForTimeout(200);
  27 |   await page.screenshot({ path: "screenshots/gl-mapping-create-dark.png", fullPage: true });
  28 | });
  29 | 
```