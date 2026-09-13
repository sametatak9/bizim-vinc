import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'src');
const mirror = path.join(root, 'artifacts', 'bizim-vinc-erp', 'src');

await mkdir(mirror, { recursive: true });
await cp(source, mirror, { recursive: true, force: true });
console.log(`[sync-source] ${source} -> ${mirror}`);
