import { writeFileSync } from 'fs';

const cjsPackageJson = JSON.stringify({ type: 'commonjs' });
const cjsPackageJsonPath = 'dist/cjs/package.json';

writeFileSync(cjsPackageJsonPath, cjsPackageJson);
