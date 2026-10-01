/**
 * AI Agent Verification Suite — 6 E2E test cases to exercise the
 * Flaky Analyzer, RCA Agent, and Self-Heal Agent in the custom TTA reporter.
 *
 * Structure:
 *   ✅ 4 legitimate, well-written tests that should PASS
 *   🐛 2 intentionally buggy tests:
 *       - Bug 1: Wrong selector in "Verify cart badge count" (selector-not-found)
 *                → Self-Heal agent detects and suggests the correct selector
 *       - Bug 2: Race condition / wrong assertion in "Sort products and verify order"
 *
 * Tags: @agent-verify
 */

import { test, expect } from '@fixtures/test-base';
import { createLogger } from '@utils/Logger';
import { visualStep } from '@utils/visualStep';
import { credentials } from '@config/credentials';
import { healLocator, isLocatorFailure } from '../../../src/ai/agents/selfHealAgent';

const log = createLogger('agent-verify');

const FIRST_ITEM_ID = 'test-allthethings-tshirt-red';
const SECOND_ITEM_ID = 'tta-practice-backpack';

test.describe('@P0 @agent-verify AI Agent Verification Suite', () => {

    test.beforeEach(async ({ loginPage }) => {
        log.info('Logging in as standard user');
        await loginPage.open();
        await loginPage.loginAs(credentials.standardUser, credentials.password);
    });

    // ═══════════════════════════════════════════════════════════════
    // ✅ TEST 1 — Should pass: Verify inventory page loads correctly
    // ═══════════════════════════════════════════════════════════════
    test('Verify inventory page loads with products @P0', async ({
        page,
        inventoryPage,
    }) => {
        await visualStep(page, 'Navigate to inventory page', async () => {
            log.info('Opening the inventory page');
            await inventoryPage.open();
        });

        await visualStep(page, 'Verify products are displayed', async () => {
            log.info('Checking that product list contains items');
            const names = await inventoryPage.productNames();
            expect(names.length).toBeGreaterThan(0);
            log.info(`Found ${names.length} products on the inventory page`);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // ✅ TEST 2 — Should pass: Add item to cart and verify cart page
    // ═══════════════════════════════════════════════════════════════
    test('Add item to cart and verify cart contents @P1', async ({
        page,
        inventoryPage,
        cartPage,
    }) => {
        await visualStep(page, 'Navigate to inventory', async () => {
            log.info('Opening inventory page');
            await inventoryPage.open();
        });

        await visualStep(page, 'Add first item to cart', async () => {
            log.info(`Adding item "${FIRST_ITEM_ID}" to cart`);
            await inventoryPage.addToCart(FIRST_ITEM_ID);
        });

        await visualStep(page, 'Open cart and verify item count', async () => {
            log.info('Opening cart page');
            await cartPage.open();
            const count = await cartPage.rowCount();
            expect(count).toBe(1);
            log.info(`Cart has ${count} item(s) — as expected`);
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // 🐛 TEST 3 — BUG: Wrong selector for cart badge
    // Uses [data-test="cart-badge-counter"] but the correct one is
    // [data-test="shopping-cart-badge"].
    // → Self-Heal agent analyzes the page DOM and suggests the fix
    // → RCA Agent classifies as "selector-not-found", severity High
    // ═══════════════════════════════════════════════════════════════
    test('Verify cart badge count after adding items @P0', async ({
        page,
        inventoryPage,
    }) => {
        await visualStep(page, 'Navigate to inventory', async () => {
            log.info('Opening inventory page');
            await inventoryPage.open();
        });

        await visualStep(page, 'Add two items to cart', async () => {
            log.info('Adding two items to the cart');
            await inventoryPage.addToCart(FIRST_ITEM_ID);
            await inventoryPage.addToCart(SECOND_ITEM_ID);
        });

        await visualStep(page, 'Verify cart badge shows correct count', async () => {
            log.info('Checking cart badge counter');
            // 🐛 BUG: Wrong selector! The actual attribute is "shopping-cart-badge"
            const badgeLocator = page.locator('[data-test="cart-badge-counter"]');
            try {
                await expect(badgeLocator).toHaveText('2', { timeout: 5000 });
            } catch (err) {
                const errorMsg = (err as Error).message;
                // 🩹 Self-Heal: detect locator failure and suggest fixes
                if (isLocatorFailure(errorMsg)) {
                    log.info('🩹 Locator failure detected — running Self-Heal agent...');
                    const healReport = await healLocator(
                        page,
                        errorMsg,
                        '[data-test="cart-badge-counter"]',
                        'cart badge showing item count',
                    );
                    // Attach the heal report for the Custom Reporter Self-Heal tab
                    await test.info().attach('self-heal', {
                        body: Buffer.from(JSON.stringify(healReport)),
                        contentType: 'application/json',
                    });
                }
                throw err; // Re-throw so the test still fails
            }
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // ✅ TEST 4 — Should pass: View item details and go back
    // ═══════════════════════════════════════════════════════════════
    test('View item details and navigate back @P1', async ({
        page,
        inventoryPage,
        itemDetailPage,
    }) => {
        await visualStep(page, 'Navigate to inventory', async () => {
            log.info('Opening inventory page');
            await inventoryPage.open();
        });

        await visualStep(page, 'Open item detail page', async () => {
            log.info('Clicking on the first item to view details');
            await inventoryPage.openItem(FIRST_ITEM_ID);
        });

        await visualStep(page, 'Verify item detail page loaded', async () => {
            const itemName = await itemDetailPage.name();
            expect(itemName.length).toBeGreaterThan(0);
            log.info(`Item detail page shows: "${itemName}"`);
        });

        await visualStep(page, 'Navigate back to inventory', async () => {
            log.info('Going back to inventory page');
            await itemDetailPage.back();
            await inventoryPage.assertLoaded();
            log.info('Successfully returned to inventory');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // 🐛 TEST 5 — BUG: Wrong assertion on sort order
    // Sorts A→Z but asserts first item is "Zebra Backpack" (doesn't exist).
    // → RCA Agent classifies as "assertion-mismatch", severity Medium
    // ═══════════════════════════════════════════════════════════════
    test('Sort products and verify order @P2', async ({
        page,
        inventoryPage,
    }) => {
        await visualStep(page, 'Navigate to inventory', async () => {
            log.info('Opening inventory page');
            await inventoryPage.open();
        });

        await visualStep(page, 'Sort products A to Z', async () => {
            log.info('Selecting A-Z sort option');
            await page.locator('[data-test="product-sort-container"]').selectOption('az');
            await page.waitForTimeout(500);
        });

        await visualStep(page, 'Verify first product is sorted correctly', async () => {
            const names = await inventoryPage.productNames();
            log.info(`First product after sort: "${names[0]}"`);
            // 🐛 BUG: Hardcoded wrong expected value
            expect(names[0]).toBe('Zebra Backpack');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // ✅ TEST 6 — Should pass: Remove item from cart
    // ═══════════════════════════════════════════════════════════════
    test('Remove item from cart and verify empty cart @P1', async ({
        page,
        inventoryPage,
        cartPage,
    }) => {
        await visualStep(page, 'Navigate to inventory and add item', async () => {
            log.info('Opening inventory and adding an item');
            await inventoryPage.open();
            await inventoryPage.addToCart(FIRST_ITEM_ID);
        });

        await visualStep(page, 'Open cart and verify item present', async () => {
            log.info('Opening cart page');
            await cartPage.open();
            expect(await cartPage.rowCount()).toBe(1);
        });

        await visualStep(page, 'Remove item from cart', async () => {
            log.info(`Removing item "${FIRST_ITEM_ID}" from cart`);
            await cartPage.remove(FIRST_ITEM_ID);
        });

        await visualStep(page, 'Verify cart is now empty', async () => {
            const count = await cartPage.rowCount();
            expect(count).toBe(0);
            log.info('Cart is empty after removal — as expected');
        });
    });

});
