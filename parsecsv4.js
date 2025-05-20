import fs from 'fs';
import csv from 'csv-parser';

function getStockDailyFromCSV() {
  return new Promise((resolve, reject) => {
    const stocks = [];

    fs.createReadStream('dailyloser.csv')
      .pipe(csv())
      .on('data', (row) => {
        const name = row['Stock Name'] || Object.values(row)[1];
        const symbol = row['Symbol'] || Object.values(row)[2];
        const change = row['% Chg'] || Object.values(row)[5];

        if (name && symbol && change) {
          stocks.push({
            stockName: name.trim(),
            stock: symbol.trim(),
            changePercent: change.trim(), 
          });
        }
      })
      .on('end', () => {
        resolve(stocks);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}


export { getStockDailyFromCSV };

