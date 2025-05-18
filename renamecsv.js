import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const rename = promisify(fs.rename);


export async function renameCsvFile(oldName, newName, directory = process.cwd()) {
  const oldPath = path.resolve(directory, oldName);
  const newPath = path.resolve(directory, newName);

  try {
    await rename(oldPath, newPath);
    console.log(`✅ Renamed '${oldName}' to '${newName}'`);
  } catch (err) {
    console.error(`❌ Error renaming file: ${err.message}`);
  }
}
