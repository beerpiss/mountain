import { readFileSync } from 'fs';

export const config = JSON.parse(readFileSync(process.env.DEV ? 'config.dev.json' : 'config.json', 'utf8'));
