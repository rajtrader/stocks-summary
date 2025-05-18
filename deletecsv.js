import { unlinkSync, existsSync } from 'fs';

/**
 * Deletes a CSV file if it exists.
 * @param {string} filePath - Path to the CSV file to delete.
 */
export function deleteCsv(filePath) {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log(`Deleted: ${filePath}`);
    } else {
      console.log(`File does not exist: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error deleting ${filePath}:`, err.message);
  }
}
