import { env, reset } from 'cloudflare:test';
import { sql } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb } from '@/worker/db/client';

afterEach(async () => {
  await reset();
});

describe('createDb', () => {
  it('runs select 1 through Drizzle', async () => {
    const db = createDb(env.DB);
    const row = await db.get<{ one: number }>(sql`select 1 as one`);
    expect(row?.one).toBe(1);
  });

  it('isolates D1 storage between tests (writes in this test)', async () => {
    const db = createDb(env.DB);
    await db.run(sql`create table if not exists isolation_probe (id integer primary key)`);
    await db.run(sql`insert into isolation_probe (id) values (1)`);
    const count = await db.get<{ c: number }>(sql`select count(*) as c from isolation_probe`);
    expect(count?.c).toBe(1);
  });

  it('does not see tables from the previous test', async () => {
    const db = createDb(env.DB);
    await expect(db.get(sql`select count(*) as c from isolation_probe`)).rejects.toThrow();
  });
});
