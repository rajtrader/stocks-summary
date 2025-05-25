import puppeteer from "puppeteer";
import fs from "fs";
import path from 'path';
import { renameCsvFile } from './renamecsv.js';
import { fileURLToPath } from 'url';
import { copyCsv } from './copycsv.js';
import { deleteCsv } from './deletecsv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function getMonthlyLosers() {
  const url = "https://money.rediff.com/losers/bse/monthly/groupa";

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table.dataTable tbody tr"));

    return rows.map(row => {
      const cols = row.querySelectorAll("td");
      const changeText = cols[4]?.innerText.trim().replace("+", "").replace("%", "").trim();
      const changePercent = parseFloat(changeText);

      if (changePercent < -25) {
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
  fs.writeFileSync("losers.csv", csvContent);
  
  console.log("CSV file saved as losers.csv");
  renameCsvFile('losers.csv', 'monthlyloss.csv');
  const sourcePath = path.join(__dirname, 'monthlyloss.csv');
  const destinationPath = path.join(__dirname, 'monthlyloser.csv');
  copyCsv(sourcePath, destinationPath);
  deleteCsv(sourcePath);
  console.log('CSV file has been renamed and copied to monthlyloser.csv');

    const csv1 = fs.readFileSync(path.join(__dirname, 'monthlyloser.csv'), 'utf-8').trim();
    const csv2 = fs.readFileSync(path.join(__dirname, 'monthlylosergroupb.csv'), 'utf-8').trim();
  
    const [header1, ...lines1] = csv1.split('\n');
    const [_, ...lines2] = csv2.split('\n'); 
  
    const combinedCsv = [header1, ...lines1, ...lines2].join('\n');
  
    fs.writeFileSync(path.join(__dirname, 'finalmonthlyloss.csv'), combinedCsv);
    console.log('CSV files combined and saved as finalmonthlyloss.csv');
  
};

