import { test } from '@playwright/test'
import { LoginPage } from '@pages/LoginPage'
import { createLogger } from '@utils/Logger'

const log = createLogger('login.spec');

test.describe('TTACart-Login', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await test.step('Open the TTACart login page', async () => {
            log.info("Opening the login page");
            await loginPage.open();
        });
    });

    test('Login with valid credentials @P0', async () => {

        await test.step('Login as standart user', async () => {
            log.info('Loggin in with standard user');
            await loginPage.loginAs('standard_user', 'tta_secret');
        })

        await test.step('Verify the user successfully logged in', async () => {
            log.info('The login screen is not visible');
            await loginPage.waitForLoginButtonHidden();
        });

    })


})
