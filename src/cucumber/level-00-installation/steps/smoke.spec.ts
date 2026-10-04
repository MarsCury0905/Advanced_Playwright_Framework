import { Given, When, Then } from '@cucumber/cucumber';
import { CucumberWorld, CREDS } from '../../support/world';

Given('I open the TTACart login page', async function (this: CucumberWorld) {
  await this.loginPage.open();
});

When('I login as the standard user', async function (this: CucumberWorld) {
  await this.loginPage.loginAs(CREDS.standardUser, CREDS.password);
});

Then('The inventory page is displayed', async function (this: CucumberWorld) {
  await this.inventoryPage.assertLoaded();
});
