import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
    test("loads activity cards", async ({ page }) => {
        await page.goto("/");
        await expect(page.locator(".activity-card")).not.toHaveCount(0);
    });

    test("filter by location shows only matching activities", async ({ page }) => {
        await page.goto("/");

        // FiltersBar renders a <select> inside a <label> containing the text "Location"
        const locationSelect = page
            .locator("label")
            .filter({ hasText: "Location" })
            .locator("select");

        // index 0 = "All locations", index 1 = first real location
        const locationName = (await locationSelect.locator("option").nth(1).textContent())!.trim();
        await locationSelect.selectOption({ index: 1 });

        // ActivityCard renders location in .booking-pill — every visible badge must match
        const locationBadges = page.locator(".booking-pill");
        await expect(locationBadges).not.toHaveCount(0);
        const count = await locationBadges.count();
        for (let i = 0; i < count; i++) {
            await expect(locationBadges.nth(i)).toHaveText(locationName);
        }
    });
});
