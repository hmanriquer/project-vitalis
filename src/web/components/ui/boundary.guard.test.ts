import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const UI_DIR = import.meta.dirname;

describe('components/ui boundary', () => {
  it('does not import from src/web/features', () => {
    const files = readdirSync(UI_DIR).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));
    for (const file of files) {
      if (file.endsWith('.test.ts')) continue;
      const source = readFileSync(join(UI_DIR, file), 'utf8');
      expect(source).not.toMatch(/@\/web\/features/);
    }
  });
});
