export type IdGenerator = {
  newToken(): string;
};

export const cryptoIdGenerator: IdGenerator = {
  newToken: () => crypto.randomUUID(),
};

export function createSequentialIdGenerator(prefix = 'test'): IdGenerator {
  let n = 0;
  return {
    newToken: () => `${prefix}-${++n}`,
  };
}
