import path from 'path';
import url from 'url';

/**
 * get __dirname variable in es module
 * @param metaUrl the value of import.meta.url of the module
 * @returns __dirname
 */
export function getDirname(metaUrl: string) {
  const __filename = url.fileURLToPath(metaUrl);
  const __dirname = path.dirname(__filename);

  return __dirname;
}
