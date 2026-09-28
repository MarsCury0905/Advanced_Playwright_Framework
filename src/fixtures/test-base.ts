// Inbuilt fixtures are already available in this case. 

/**
 * test-base — the project's custom Playwright `test`, pre-wired with a fixture
 * for every TTACart Page Object.
 *
 * Instead of `new LoginPage(page)` in each spec, ask for the page you need and
 * it's handed over already constructed against the test's `page`:
 *
 *   import { test, expect } from '@fixtures/test-base';
 *
 *   test('add to cart', async ({ inventoryPage, cartPage }) => {
 *       await inventoryPage.open();
 *       await inventoryPage.addToCart('tta-bike-light');
 *       await cartPage.open();
 *       expect(await cartPage.rowCount()).toBe(1);
 *   });
 *
 * Plain page-object fixtures hand over constructed objects without navigating.
 * State fixtures (`invalidLogin`, `validLogin`, `loginWithInventory`, and
 * `loginWithSelectedItem`) perform reusable setup only when a test requests one.
 */

import { test as base, expect } from '@playwright/test'
import { LoginPage } from '@pages/LoginPage'
import { InventoryPage } from '@pages/InventryPage'
import { ItemDetailPage } from '@pages/ItemDetailPage'
import { CartPage } from '@pages/CartPage'
import { CheckoutStepOnePage } from '@pages/CheckOutPageOne'
import { CheckoutStepTwoPage } from '@pages/CheckOutPageTwo'
import { CheckoutCompletePage } from '@pages/CheckOutCompletePage'


export type TestFixture = {
    //Page Objects
    loginPage: LoginPage;
    inventoryPage: InventoryPage;
    itemDetailPage: ItemDetailPage;
    cartPage: CartPage;
    checkoutStepOnePage: CheckoutStepOnePage;
    checkoutStepTwoPage: CheckoutStepTwoPage;
    checkoutCompletePage: CheckoutCompletePage;
};

export const test = base.extend<TestFixture>({

    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    inventoryPage: async ({ page }, use) => {
        await use(new InventoryPage(page));
    },
    itemDetailPage: async ({ page }, use) => {
        await use(new ItemDetailPage(page));
    },
    cartPage: async ({ page }, use) => {
        await use(new CartPage(page));
    },
    checkoutStepOnePage: async ({ page }, use) => {
        await use(new CheckoutStepOnePage(page));
    },
    checkoutStepTwoPage: async ({ page }, use) => {
        await use(new CheckoutStepTwoPage(page));
    },
    checkoutCompletePage: async ({ page }, use) => {
        await use(new CheckoutCompletePage(page));
    },
});

export { expect } from '@playwright/test'