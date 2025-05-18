import puppeteer from 'puppeteer';
import path from 'path';
import { renameCsvFile } from './renamecsv.js';
import { fileURLToPath } from 'url';
import { copyCsv } from './copycsv.js';
import { deleteCsv } from './deletecsv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMonthlyGainerScraper() {
  const downloadPath = path.resolve('./');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--download.default_directory=${downloadPath}`,
      '--disable-extensions',
    ],
  });

  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });

  await page.goto('https://chartink.com/screener', { waitUntil: 'networkidle2' });

  await page.waitForSelector('div.bg-violet-blaze.w-6.h-6');
  await page.click('div.bg-violet-blaze.w-6.h-6');
  console.log('Clicked Add Filter/Group button!');

  await page.waitForSelector('#null-13');
  const liItem = await page.$('#null-13');
  if (liItem) {
    await liItem.click();
    console.log('Clicked on "% Change" option!');
  } else {
    console.error('"% Change" option not found!');
  }

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  await delay(2000);

  await page.waitForSelector('#select-operation');
  const selectOperation = await page.$('#select-operation');
  const operationOption = await selectOperation.$('.multiselectcustom__content-wrapper li#null-10');
  if (operationOption) {
    await operationOption.click();
    console.log('Clicked on "Greater" operation');
  }

  await page.waitForSelector('#select-measure-input');
  const selectMeasure = await page.$('#select-measure-input');
  const numberOption = await selectMeasure.$('.multiselectcustom__content-wrapper li#null-1');
  if (numberOption) {
    await numberOption.click();
    console.log('Clicked on "Number" under measure input');
  }

  await page.waitForSelector('span.number');
  await page.click('span.number');
  console.log('Clicked on visible number span');

  await page.waitForSelector('.atlas-input', { visible: true });
  await page.evaluate(() => {
    const input = document.querySelector('.atlas-input');
    if (input) {
      input.style.display = 'inline';
      input.value = '';
    }
  });

  await page.type('.atlas-input', '25');
  console.log('Typed 25 into the input field');
  await page.keyboard.press('Tab');

  await page.waitForSelector('span.atlas-offset');
  await page.click('span.atlas-offset');
  console.log('Clicked on "Daily" to open offset dropdown');

  await page.waitForSelector('#select-offset');
  const selectOffset = await page.$('#select-offset');
  const divtab = await selectOffset.$('.multiselectcustom__content-wrapper li#null-30');
  if (divtab) {
    await divtab.click();
    console.log('Clicked on "Monthly" option');
  }

  await page.waitForSelector('.run_scan_button');
  await page.click('.run_scan_button');
  console.log('Clicked on "Run Scan" button!');
  await delay(5000);

  await page.waitForSelector('button.buttons-csv');
  await page.click('button.buttons-csv');
  console.log('Clicked CSV button. Download should start...');
  await delay(5000);

  console.log(`File should be downloaded to: ${downloadPath}`);
  await renameCsvFile('Stock Screener, Technical Analysis Scanner.csv', 'monthlygain.csv');
  const sourcePath = path.join(__dirname, 'monthlygain.csv');
  const destinationPath = path.join(__dirname, 'monthlygainer.csv');
  copyCsv(sourcePath, destinationPath);
  deleteCsv(sourcePath);
  console.log('CSV file has been renamed and copied to monthlygainer.csv');

  await browser.close();
}
