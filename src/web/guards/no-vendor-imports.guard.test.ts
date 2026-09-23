import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const WEB_ROOT = join(import.meta.dirname, '..');
const FORBIDDEN = [/from ['"]drizzle-orm/, /from ['"]resend/, /mercadopago/i];

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (/\.(tsx?|jsx?)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

describe('web vendor import guard', () => {
  it('does not import server vendors under src/web', () => {
    const files = collectSourceFiles(WEB_ROOT);
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN) {
        expect(source, `${file} must not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
