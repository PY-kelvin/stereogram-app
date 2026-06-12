# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: map.spec.js >> Stereogram Map Edge Cases & Scaling >> Rule of Stays: Avatar does not move backwards when clicking earlier stages
- Location: tests\e2e\map.spec.js:5:3

# Error details

```
TypeError: Cannot read properties of null (reading 'y')
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - button "⬅ Back" [ref=e4] [cursor=pointer]
    - generic [ref=e5]: 10:00
    - generic [ref=e7]: Stage 2
  - generic [ref=e8]:
    - button "<" [ref=e9] [cursor=pointer]
    - img "Stereogram" [ref=e10]
    - button ">" [ref=e11] [cursor=pointer]
  - generic [ref=e12]:
    - button "▶" [ref=e13] [cursor=pointer]
    - button "💾" [ref=e14] [cursor=pointer]
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.describe('Stereogram Map Edge Cases & Scaling', () => {
  4  | 
  5  |   test('Rule of Stays: Avatar does not move backwards when clicking earlier stages', async ({ page }) => {
  6  |     // 1. Inject a mock profile before the page loads
  7  |     await page.addInitScript(() => {
  8  |       const mockUser = {
  9  |         name: "TestUser",
  10 |         streak: 15,
  11 |         sessionHistory: [],
  12 |         currentAvatar: "avatar_cat.png",
  13 |         unlockedStages: [1, 2],
  14 |         isSetup: true
  15 |       };
  16 |       localStorage.setItem('currentUser', 'test@example.com');
  17 |       localStorage.setItem('user_test@example.com', JSON.stringify(mockUser));
  18 |     });
  19 |     
  20 |     await page.goto(`file:///${__dirname.replace(/\\/g, '/')}/../../index.html`);
  21 | 
  22 |     // Navigate to Map
  23 |     await page.locator('#btn-welcome-start').click();
  24 |     await page.locator('#btn-menu-start').click();
  25 | 
  26 |     // 2. Wait for the avatar to render and get its initial bounding box
  27 |     const avatar = page.locator('#player-avatar');
  28 |     await expect(avatar).toBeVisible();
  29 |     const initialBox = await avatar.boundingBox();
  30 |     
  31 |     // 3. Click stage 1, then stage 2, then stage 1 repeatedly
  32 |     await page.locator('#node-stage1').click({ force: true });
  33 |     await page.waitForTimeout(1100); // Wait for the 1000ms animation timeout
  34 |     
  35 |     await page.locator('#node-stage2').click({ force: true });
  36 |     await page.waitForTimeout(1100);
  37 | 
  38 |     // 4. Get final bounding box
  39 |     const finalBox = await avatar.boundingBox();
  40 |     
  41 |     // 5. Assert that the Y position (or X depending on responsive layout) hasn't changed
  42 |     // The avatar should stay at the furthest unlocked/streak point, not go backwards
> 43 |     expect(finalBox.y).toBeCloseTo(initialBox.y, 0);
     |                     ^ TypeError: Cannot read properties of null (reading 'y')
  44 |     expect(finalBox.x).toBeCloseTo(initialBox.x, 0);
  45 |   });
  46 | 
  47 |   test('Stage Unlocks: Ensure locked stages are completely inaccessible', async ({ page }) => {
  48 |     await page.addInitScript(() => {
  49 |       const mockUser = { name: "TestUser", streak: 2, sessionHistory: [], currentAvatar: "avatar_cat.png", unlockedStages: [1], isSetup: true };
  50 |       localStorage.setItem('currentUser', 'test@example.com');
  51 |       localStorage.setItem('user_test@example.com', JSON.stringify(mockUser));
  52 |     });
  53 |     
  54 |     await page.goto(`file:///${__dirname.replace(/\\/g, '/')}/../../index.html`);
  55 | 
  56 |     // Navigate to Map
  57 |     await page.locator('#btn-welcome-start').click();
  58 |     await page.locator('#btn-menu-start').click();
  59 | 
  60 |     // Try to click stage 2 (locked for this user)
  61 |     await page.locator('#node-stage2').click({ force: true });
  62 |     
  63 |     // Verify password modal is shown instead of jumping to game
  64 |     const pwdModal = page.locator('#password-modal');
  65 |     await expect(pwdModal).toBeVisible();
  66 |   });
  67 | 
  68 |   test('Scaling: Extreme streak limits avatar positioning to 100% max', async ({ page }) => {
  69 |     await page.addInitScript(() => {
  70 |       // User with 10,000 day streak (Edge Case)
  71 |       const mockUser = { name: "TestUser", streak: 10000, sessionHistory: [], currentAvatar: "avatar_cat.png", unlockedStages: [1,2,3,4,5,6], isSetup: true };
  72 |       localStorage.setItem('currentUser', 'test@example.com');
  73 |       localStorage.setItem('user_test@example.com', JSON.stringify(mockUser));
  74 |     });
  75 | 
  76 |     await page.goto(`file:///${__dirname.replace(/\\/g, '/')}/../../index.html`);
  77 | 
  78 |     // Navigate to Map
  79 |     await page.locator('#btn-welcome-start').click();
  80 |     await page.locator('#btn-menu-start').click();
  81 | 
  82 |     const avatar = page.locator('#player-avatar');
  83 |     await expect(avatar).toBeVisible();
  84 |     
  85 |     // If the ratio math failed, the avatar would fly thousands of pixels off screen.
  86 |     // Ensure it is still within the viewport
  87 |     const box = await avatar.boundingBox();
  88 |     const viewport = page.viewportSize();
  89 |     
  90 |     expect(box.x).toBeGreaterThanOrEqual(0);
  91 |     expect(box.y).toBeGreaterThanOrEqual(0);
  92 |     expect(box.x).toBeLessThanOrEqual(viewport.width);
  93 |     expect(box.y).toBeLessThanOrEqual(viewport.height);
  94 |   });
  95 | });
  96 | 
```