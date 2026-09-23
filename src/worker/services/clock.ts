export type Clock = {
  now(): Date;
};

export const systemClock: Clock = {
  now: () => new Date(),
};

export function createFakeClock(fixed: Date): Clock {
  return { now: () => fixed };
}
