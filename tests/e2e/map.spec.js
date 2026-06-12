const { test, expect } = require('@playwright/test');

test.describe('Stereogram Map Edge Cases & Scaling', () => {

  test('Rule of Stays: Avatar does not move backwards when clicking earlier stages', async ({ page }) => {
    // 1. Inject a mock profile before the page loads
    await page.addInitScript(() => {
      const mockUser = {
        name: "TestUser",
        streak: 15,
        sessionHistory: [],
        currentAvatar: "avatar_cat.png",
        unlockedStages: [1, 2],
        isSetup: true
      };
      localStorage.setItem('currentUser', 'test@example.com');
      localStorage.setItem('user_test@example.com', JSON.stringify(mockUser));
    });
    
    await page.goto(`file:///${__dirname.replace(/\\/g, '/')}/../../index.html`);

    // Navigate to Map
    await page.locator('#btn-welcome-start').click();
    await page.locator('#btn-menu-start').click();

    // Mock Game.startStage so clicking nodes doesn't hide the map
    await page.evaluate(() => {
        window.Game.startStage = () => {};
    });

    // 2. Wait for the avatar to render and get its initial bounding box
    const avatar = page.locator('#player-avatar');
    await expect(avatar).toBeVisible();
    const initialBox = await avatar.boundingBox();
    
    // 3. Click stage 1, then stage 2, then stage 1 repeatedly
    await page.locator('#node-stage1').click({ force: true });
    await page.waitForTimeout(1100); // Wait for the 1000ms animation timeout
    
    await page.locator('#node-stage2').click({ force: true });
    await page.waitForTimeout(1100);

    // 4. Get final bounding box
    const finalBox = await avatar.boundingBox();
    
    // 5. Assert that the Y position (or X depending on responsive layout) hasn't changed
    // The avatar should stay at the furthest unlocked/streak point, not go backwards
    expect(finalBox.y).toBeCloseTo(initialBox.y, 0);
    expect(finalBox.x).toBeCloseTo(initialBox.x, 0);
  });

  test('Stage Unlocks: Ensure locked stages are completely inaccessible', async ({ page }) => {
    await page.addInitScript(() => {
      const mockUser = { name: "TestUser", streak: 2, sessionHistory: [], currentAvatar: "avatar_cat.png", unlockedStages: [1], isSetup: true };
      localStorage.setItem('currentUser', 'test@example.com');
      localStorage.setItem('user_test@example.com', JSON.stringify(mockUser));
    });
    
    await page.goto(`file:///${__dirname.replace(/\\/g, '/')}/../../index.html`);

    // Navigate to Map
    await page.locator('#btn-welcome-start').click();
    await page.locator('#btn-menu-start').click();

    // Try to click stage 2 (locked for this user)
    await page.locator('#node-stage2').click({ force: true });
    
    // Verify password modal is shown instead of jumping to game
    const pwdModal = page.locator('#password-modal');
    await expect(pwdModal).toBeVisible();
  });

  test('Scaling: Extreme streak limits avatar positioning to 100% max', async ({ page }) => {
    await page.addInitScript(() => {
      // User with 10,000 day streak (Edge Case)
      const mockUser = { name: "TestUser", streak: 10000, sessionHistory: [], currentAvatar: "avatar_cat.png", unlockedStages: [1,2,3,4,5,6], isSetup: true };
      localStorage.setItem('currentUser', 'test@example.com');
      localStorage.setItem('user_test@example.com', JSON.stringify(mockUser));
    });

    await page.goto(`file:///${__dirname.replace(/\\/g, '/')}/../../index.html`);

    // Navigate to Map
    await page.locator('#btn-welcome-start').click();
    await page.locator('#btn-menu-start').click();

    const avatar = page.locator('#player-avatar');
    await expect(avatar).toBeVisible();
    
    // If the ratio math failed, the avatar would fly thousands of pixels off screen.
    // Ensure it is still within the viewport
    const box = await avatar.boundingBox();
    const viewport = page.viewportSize();
    
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x).toBeLessThanOrEqual(viewport.width);
    expect(box.y).toBeLessThanOrEqual(viewport.height);
  });
});
