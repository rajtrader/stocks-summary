import puppeteer from "puppeteer";
import fs from "fs";
import path from 'path';
import { renameCsvFile } from './renamecsv.js';
import { fileURLToPath } from 'url';
import { copyCsv } from './copycsv.js';
import { deleteCsv } from './deletecsv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function runMonthlyGainerScraper()  {
  const url = "https://money.rediff.com/gainers/bse/monthly/groupa";

  const browser = await puppeteer.launch({ 
    headless: true,
   
    defaultViewport: null,
    timeout: 0,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--disable-extensions',
      '--disable-blink-features=AutomationControlled', // Important
    '--window-size=1920,1080'
    ],
       ignoreHTTPSErrors: true,
   });
  const page = await browser.newPage();
    
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );
  
  await page.setExtraHTTPHeaders({
    'accept-language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  await page.goto(url, { waitUntil: "domcontentloaded" });

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table.dataTable tbody tr"));

    return rows.map(row => {
      const cols = row.querySelectorAll("td");
      const changeText = cols[4]?.innerText.trim().replace("+", "").replace("%", "").trim();
      const changePercent = parseFloat(changeText);

      if (changePercent > 25) {
        return {
          company: cols[0]?.innerText.trim(),
          changePercent: cols[4]?.innerText.trim(),
        };
      }
      return null;
    }).filter(Boolean);
  });

  // Convert to CSV format
  const csvHeader = "Company,Change\n";
  const csvRows = data.map(item => `${item.company},${item.changePercent}`).join("\n");
  const csvContent = csvHeader + csvRows;

  // Write to file
  fs.writeFileSync("gainers_a.csv", csvContent);
  
  console.log("CSV file saved as gainers_a.csv");
  const sourcePath = path.join(__dirname, 'gainers_a.csv');
  const destinationPath = path.join(__dirname, 'monthlygainer_a.csv');
  copyCsv(sourcePath, destinationPath);
  deleteCsv(sourcePath);
  console.log('CSV file has been renamed and copied to monthlygainer_a.csv');

  const csv1 = fs.readFileSync(path.join(__dirname, 'monthlygainer_a.csv'), 'utf-8').trim();
  const csv2 = fs.readFileSync(path.join(__dirname, 'monthlygainers_b.csv'), 'utf-8').trim();

  const [header1, ...lines1] = csv1.split('\n');
  const [_, ...lines2] = csv2.split('\n'); 

  const combinedCsv = [header1, ...lines1, ...lines2].join('\n');

  fs.writeFileSync(path.join(__dirname, 'finalmonthly.csv'), combinedCsv);
  const sourcePath1 = path.join(__dirname, 'finalmonthly.csv');
  const destinationPath1 = path.join(__dirname, 'finalmonthlygain.csv');
  copyCsv(sourcePath1, destinationPath1);
  deleteCsv(sourcePath1);
  
  console.log('CSV files combined and saved as finalmonthlygain.csv');

};
