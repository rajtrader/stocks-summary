import { writeFileSync, copyFileSync } from 'fs';

/**
 * Copies a CSV file to another after emptying the destination file.
 * @param {string} sourceFile - Path to the source CSV file.
 * @param {string} destinationFile - Path to the destination CSV file.
 */
export function copyCsv(sourceFile, destinationFile) {
  try {
    // Step 1: Empty the destination file
    writeFileSync(destinationFile, '', 'utf8');
    console.log(`Emptied: ${destinationFile}`);

    // Step 2: Copy contents
    copyFileSync(sourceFile, destinationFile);
    console.log(`Copied from ${sourceFile} to ${destinationFile}`);
  } catch (err) {
    console.error('Error in copyCsv:', err.message);
  }
}
