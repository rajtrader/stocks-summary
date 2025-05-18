import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDateToCSV = () => {
  try {
    // Get current file path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // CSV file path (assuming it's in the root directory)
    const csvFilePath = path.join(__dirname, '6months.csv'); // Change 'stocks.csv' to your actual filename
    
    // Read the CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    // Split into lines
    let lines = csvData.split('\n');
    
    // Get today's date
    const todayDate = getTodayDate();
    
    // Add Date column to header if not already present
    if (!lines[0].includes('"Date"')) {
      lines[0] = lines[0].trim();
      if (lines[0].endsWith(',')) {
        lines[0] += '"Date"';
      } else {
        lines[0] += ',"Date"';
      }
    }
    
    // Add date to each data row
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      lines[i] = lines[i].trim();
      if (lines[i].endsWith(',')) {
        lines[i] += `"${todayDate}"`;
      } else {
        lines[i] += `,"${todayDate}"`;
      }
    }
    
    // Join lines back together
    const updatedCSV = lines.join('\n');
    
    // Write back to the file
    fs.writeFileSync(csvFilePath, updatedCSV, 'utf8');
    
    console.log('Successfully added today\'s date to the CSV file.');
  } catch (error) {
    console.error('Error processing CSV file:', error);
  }
};

// Run the function
addDateToCSV();