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

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

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
  fs.writeFileSync("gainers.csv", csvContent);
  
  console.log("CSV file saved as gainers.csv");
  renameCsvFile('gainers.csv', 'monthlygain.csv');
  const sourcePath = path.join(__dirname, 'monthlygain.csv');
  const destinationPath = path.join(__dirname, 'monthlygainers.csv');
  copyCsv(sourcePath, destinationPath);
  deleteCsv(sourcePath);
  console.log('CSV file has been renamed and copied to monthlygainer.csv');


};
