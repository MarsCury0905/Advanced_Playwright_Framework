import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { BrowserContext, Page } from 'playwright';

import { LoginPage } from '@pages/LoginPage';
import { InventoryPage } from '@pages/InventryPage';
import { ItemDetailPage } from '@pages/ItemDetailPage';
import { CartPage } from '@pages/CartPage';
import { CheckoutStepOnePage } from '@pages/CheckOutPageOne';
import { CheckoutStepTwoPage } from '@pages/CheckOutPageTwo';
import { CheckoutCompletePage } from '@pages/CheckOutCompletePage';
/**
 * Custom Cucumber World — launches a Playwright browser
 * and exposes `page` and Page Objects to every step definition.
 */

export const BASE_URL = process.env.BASE_URL ?? 'https://app.thetestingacademy.com';

export const CREDS = {
    standardUser : process.env.STANDARD_USER ?? "standard_user",
    password : process.env.TTA_SECRET ?? "tta_secret"
} as const

export class CucumberWorld extends World {
  context!: BrowserContext;
  page!: Page;

  // Page Objects (matching pages fixture in test-base.ts)
  loginPage!: LoginPage;
  inventoryPage!: InventoryPage;
  itemDetailPage!: ItemDetailPage;
  cartPage!: CartPage;
  checkoutStepOnePage!: CheckoutStepOnePage;
  checkoutStepTwoPage!: CheckoutStepTwoPage;
  checkoutCompletePage!: CheckoutCompletePage;

  scratch : Record<string, unknown> ={};

  constructor(options: IWorldOptions) {
    super(options);
  }

  initPages() : void{
    this.loginPage = new LoginPage(this.page);
    this.inventoryPage = new InventoryPage(this.page);
    this.itemDetailPage = new ItemDetailPage(this.page);
    this.cartPage = new CartPage(this.page);
    this.checkoutStepOnePage = new CheckoutStepOnePage(this.page);
    this.checkoutStepTwoPage = new CheckoutStepTwoPage(this.page);
    this.checkoutCompletePage = new CheckoutCompletePage(this.page);
  }
}

setWorldConstructor(CucumberWorld);
