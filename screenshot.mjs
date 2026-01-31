import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Desktop - click cart to open drawer
await page.setViewport({ width: 1920, height: 1080 });
await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 60000 });
await wait(2000);

// Click the cart button to open the drawer
const cartButton = await page.$('button[class*="relative"]');
if (cartButton) {
  await cartButton.click();
  await wait(500); // Wait for animation
  await page.screenshot({ path: 'screenshots/screenshot-cart-open.png', fullPage: false });
  console.log('✓ Cart drawer screenshot saved');
} else {
  console.log('✗ Could not find cart button');
}

// Close and take regular screenshot
await page.keyboard.press('Escape');
await wait(300);
await page.screenshot({ path: 'screenshots/screenshot-desktop-fold.png', fullPage: false });
console.log('✓ Desktop above-fold screenshot saved');

// Mobile with cart open
await page.setViewport({ width: 375, height: 812 });
await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 60000 });
await wait(2000);

const mobileCartButton = await page.$('button[class*="relative"]');
if (mobileCartButton) {
  await mobileCartButton.click();
  await wait(500);
  await page.screenshot({ path: 'screenshots/screenshot-cart-mobile.png', fullPage: false });
  console.log('✓ Mobile cart drawer screenshot saved');
}

await browser.close();
console.log('\nAll screenshots completed!');
