
import puppeteer from 'puppeteer';
import path from 'path';
import { renameCsvFile } from './renamecsv.js';
import { fileURLToPath } from 'url';
import { copyCsv } from './copycsv.js';
import { deleteCsv } from './deletecsv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runChartinkScraper() {
  const downloadPath = path.resolve('./');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
    `--download.default_directory=${downloadPath}`,
    '--disable-extensions',
    '--no-sandbox',
    '--disable-setuid-sandbox',

    ],
  });

  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });

  await page.goto('https://chartink.com/screener', { waitUntil: 'networkidle2' });

  // Your entire scraping logic remains the same here...
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  await page.waitForSelector('div.bg-violet-blaze.w-6.h-6');
  await page.click('div.bg-violet-blaze.w-6.h-6');

  await page.waitForSelector('#null-13');
  const liItem = await page.$('#null-13');
  if (liItem) {
    await liItem.click();
  }

  await delay(2000);

  await page.waitForSelector('#select-operation');
  const selectOperation = await page.$('#select-operation');
  const operationOption = await selectOperation.$('.multiselectcustom__content-wrapper li#null-10');
  if (operationOption) {
    await operationOption.click();
  }

  await page.waitForSelector('#select-measure-input');
  const selectMeasure = await page.$('#select-measure-input');
  const numberOption = await selectMeasure.$('.multiselectcustom__content-wrapper li#null-1');
  if (numberOption) {
    await numberOption.click();
  }

  await page.waitForSelector('span.number');
  await page.click('span.number');

  await page.waitForSelector('.atlas-input', { visible: true });

  await page.evaluate(() => {
    const input = document.querySelector('.atlas-input');
    if (input) {
      input.style.display = 'inline';
      input.value = '';
    }
  });

  await page.type('.atlas-input', '10');
  await page.keyboard.press('Tab');

  await page.waitForSelector('.run_scan_button');
  await page.click('.run_scan_button');

  await delay(5000);

  await page.waitForSelector('button.buttons-csv');
  await page.click('button.buttons-csv');

  await delay(5000);

  console.log(`File should be downloaded to: ${downloadPath}`);
  await renameCsvFile('Stock Screener, Technical Analysis Scanner.csv', 'dailygain.csv');
  const sourcePath = path.join(__dirname, 'dailygain.csv');
  const destinationPath = path.join(__dirname, 'dailygainer.csv');
  copyCsv(sourcePath, destinationPath);
  const csvPath = path.join(__dirname, 'dailygain.csv');
  deleteCsv(csvPath);
  console.log('CSV file has been renamed and copied to dailygainer.csv');

  await browser.close();
}
