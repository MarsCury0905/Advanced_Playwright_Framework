import { test, expect } from '@fixtures/test-base'
import { DataGenerator } from '@utils/DataGenerator'

import { createLogger } from '@utils/Logger'
import { credentials } from '@config/credentials'

const log = createLogger('e2e-checkout-steps');

// First product card on the TTACart inventory page.
const FIRST_ITEM_ID = 'test-allthethings-tshirt-red';

test.describe('@P0 @Regression E2E @Checkout Feature (test.step)', () => {
    // Step 1 — every test in this suite starts already logged in.
    test.beforeEach(async ({ loginPage }) => {
        log.info(`Step 1: Logging in as ${credentials.standardUser}`);
        await loginPage.open();
        await loginPage.loginAs(credentials.standardUser, credentials.password);
    });


    //set up the environment Username and Password
    test('Should complete checkout successfully', async ({
        inventoryPage,
        cartPage,
        checkoutStepOnePage,
        checkoutStepTwoPage,
        checkoutCompletePage,
    }) => {
        const customer = DataGenerator.checkoutCustomer();

        // Step 2 - inventory
        await test.step('Go to the inventory page', async () => {
            log.info('Step 2: navigating to the inventory page');
            await inventoryPage.open();
        });

        // Step 3 — add one item
        await test.step('Add one item to the cart', async () => {
            log.info(`Step 3: adding item "${FIRST_ITEM_ID}" to the cart`);
            await inventoryPage.addToCart(FIRST_ITEM_ID);
        });

        // Step 4 - Cart, then checkout step one + step two
        await test.step('Open the cart', async () => {
            log.info('Step 4: opening the cart and verifying one row');
            await cartPage.open();
            expect(await cartPage.rowCount()).toBe(1);
        });

        await test.step('Fill guest details (checkout step one)', async () => {
            log.info(`Step 5a: filling guest details for ${customer.firstName} ${customer.lastName}`);
            await cartPage.checkout();
            await checkoutStepOnePage.assertLoaded();
            await checkoutStepOnePage.fillGuest(customer);
            await checkoutStepOnePage.continue();
        });

        await test.step('Finish the order (checkout step two)', async () => {
            log.info('Step 5b: reviewing the overview and finishing the order');
            await checkoutStepTwoPage.assertLoaded();
            await checkoutStepTwoPage.finish();
        });

        // Step 5 — order complete
        await test.step('Order is complete', async () => {
            log.info('Step 6: asserting the order is complete');
            await checkoutCompletePage.assertOrderComplete();
        });
    });
});
