import { readFileSync } from "fs";
import { join } from "path";
import {Given, When, Then, DataTable} from '@cucumber/cucumber'
import {expect} from '@playwright/test'
import {CucumberWorld, CREDS} from '../../support/world'
import type { CheckoutCustomer } from "@utils/DataGenerator";

type CustomerBook = Record<string, CheckoutCustomer>;

const customers : CustomerBook = JSON.parse(
    readFileSync(join(__dirname, '../data/customers.json'), 'utf-8')
);

//-----------Shared Given Steps--------------
Given('I am logged in as a standard user', async function(this : CucumberWorld){
    await this.loginPage.open();
    await this.loginPage.loginAs(CREDS.standardUser, CREDS.password);
    await this.inventoryPage.assertLoaded();
});

Given('I am on the products page', async function(this:CucumberWorld){
    await this.inventoryPage.open();
})

//----------Scenario Outline outcome----------
Given('I should see the {string}', async function(this:CucumberWorld, outcome:string){
if(outcome==="products"){
    await this.inventoryPage.assertLoaded();
}else{
    await expect(this.page.locator('[data-test="error"]')).toBeVisible();
}
});

//-------------Data Table----------------
When('I add the following products to the cart', async function(this:CucumberWorld, table:DataTable){
    for(const {productId} of table.hashes()){
        await this.inventoryPage.addToCart(productId);
    }
})


Then('the cart should contain {int} products', async function(this:CucumberWorld, count){
    await this.cartPage.open();
    expect(await this.cartPage.rowCount()).toBe(count);
});

//-------------Single Product + External Data checkout----------------
When('I add a product {string} to the cart', async function(this:CucumberWorld, productId){
        await this.inventoryPage.addToCart(productId);
})

When('I checkout as the {string} customer', async function(this:CucumberWorld, person){
        const customer = customers[person];
        if(!customer) throw new Error(`No customer ${person} in customers.json`)

         await this.cartPage.open();
         await this.cartPage.checkout();
         await this.checkoutStepOnePage.assertLoaded();
         await this.checkoutStepOnePage.fillGuest(customer);
         await this.checkoutStepOnePage.continue();
         await this.checkoutStepTwoPage.assertLoaded();
         await this.checkoutStepTwoPage.finish();
})

Then('the order should be confirmed', async function(this:CucumberWorld){
    await this.checkoutCompletePage.assertOrderComplete(); 
});


