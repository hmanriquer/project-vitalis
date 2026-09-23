import { eq, sql } from 'drizzle-orm';
import type { Db } from '@/worker/db/client';
import { reservations, stockAuditLogs, variants } from '@/worker/db/schema';
import {
  InvalidStockOperationError,
  type StockReservationItem,
  StockShortageError,
} from '@/worker/features/stock/types';
import { AppError } from '@/worker/lib/errors';
import { type Clock, systemClock } from '@/worker/services/clock';
import { cryptoIdGenerator, type IdGenerator } from '@/worker/services/ids';

export type StockServiceDeps = {
  ids?: IdGenerator;
  clock?: Clock;
};

export type ManualStockCorrectionParams = {
  variantId: string;
  newOnHand: number;
  reason: string;
  actorId?: string;
};

type BatchQuery = Parameters<Db['batch']>[0][number];

async function runBatch(db: Db, queries: BatchQuery[]): Promise<void> {
  if (queries.length === 0) return;
  await db.batch(queries as [BatchQuery, ...BatchQuery[]]);
}

function assertPositiveQuantities(items: StockReservationItem[]): void {
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new InvalidStockOperationError('La cantidad debe ser un entero mayor a cero', {
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }
  }
}

async function findShortage(db: Db, items: StockReservationItem[]) {
  for (const item of items) {
    const [variant] = await db
      .select({ onHand: variants.onHand, reserved: variants.reserved })
      .from(variants)
      .where(eq(variants.id, item.variantId));
    const available = variant ? variant.onHand - variant.reserved : 0;
    if (available < item.quantity) {
      return { variantId: item.variantId, requested: item.quantity, available };
    }
  }
  return undefined;
}

function isStockInvariantViolation(error: unknown): boolean {
  return error instanceof Error && error.message.includes('variants_stock_invariants');
}

async function throwShortageOrRethrow(
  db: Db,
  items: StockReservationItem[],
  error: unknown,
): Promise<never> {
  if (isStockInvariantViolation(error)) {
    const shortage = await findShortage(db, items);
    if (shortage) {
      throw new StockShortageError(shortage.variantId, shortage.requested, shortage.available);
    }
  }
  throw error;
}

export async function reserveStock(
  db: Db,
  items: StockReservationItem[],
  orderId: string,
  expiresAt: Date,
  deps: StockServiceDeps = {},
): Promise<void> {
  assertPositiveQuantities(items);

  const ids = deps.ids ?? cryptoIdGenerator;
  const clock = deps.clock ?? systemClock;

  const updates = items.map((item) =>
    db
      .update(variants)
      .set({
        reserved: sql`case when (${variants.onHand} - ${variants.reserved}) >= ${item.quantity} then ${variants.reserved} + ${item.quantity} else -1 end`,
      })
      .where(eq(variants.id, item.variantId)),
  );

  const inserts = items.map((item) =>
    db.insert(reservations).values({
      id: ids.newToken(),
      orderId,
      variantId: item.variantId,
      quantity: item.quantity,
      expiresAt,
      createdAt: clock.now(),
    }),
  );

  try {
    await runBatch(db, [...updates, ...inserts]);
  } catch (error) {
    await throwShortageOrRethrow(db, items, error);
  }
}

export async function confirmReservation(db: Db, orderId: string): Promise<void> {
  const heldQuantity = sql`(select coalesce(sum(${reservations.quantity}), 0) from ${reservations} where ${reservations.orderId} = ${orderId} and ${reservations.variantId} = ${variants.id})`;
  const hasHold = sql`exists (select 1 from ${reservations} where ${reservations.orderId} = ${orderId} and ${reservations.variantId} = ${variants.id})`;

  await runBatch(db, [
    db
      .update(variants)
      .set({
        reserved: sql`${variants.reserved} - ${heldQuantity}`,
        onHand: sql`${variants.onHand} - ${heldQuantity}`,
      })
      .where(hasHold),
    db.delete(reservations).where(eq(reservations.orderId, orderId)),
  ]);
}

export async function releaseReservation(db: Db, orderId: string): Promise<void> {
  const heldQuantity = sql`(select coalesce(sum(${reservations.quantity}), 0) from ${reservations} where ${reservations.orderId} = ${orderId} and ${reservations.variantId} = ${variants.id})`;
  const hasHold = sql`exists (select 1 from ${reservations} where ${reservations.orderId} = ${orderId} and ${reservations.variantId} = ${variants.id})`;

  await runBatch(db, [
    db
      .update(variants)
      .set({
        reserved: sql`${variants.reserved} - ${heldQuantity}`,
      })
      .where(hasHold),
    db.delete(reservations).where(eq(reservations.orderId, orderId)),
  ]);
}

export async function recordWhatsAppSale(
  db: Db,
  items: StockReservationItem[],
  _orderId?: string,
): Promise<void> {
  assertPositiveQuantities(items);

  const updates = items.map((item) =>
    db
      .update(variants)
      .set({
        onHand: sql`case when (${variants.onHand} - ${variants.reserved}) >= ${item.quantity} then ${variants.onHand} - ${item.quantity} else -1 end`,
      })
      .where(eq(variants.id, item.variantId)),
  );

  try {
    await runBatch(db, updates);
  } catch (error) {
    await throwShortageOrRethrow(db, items, error);
  }
}

export async function manualStockCorrection(
  db: Db,
  params: ManualStockCorrectionParams,
  deps: StockServiceDeps = {},
): Promise<void> {
  const reason = params.reason?.trim() ?? '';
  if (reason.length === 0) {
    throw new AppError('invalid_argument', 'Se requiere un motivo para el ajuste manual', 400);
  }

  const [variant] = await db.select().from(variants).where(eq(variants.id, params.variantId));
  if (!variant) {
    throw new AppError('not_found', 'Variante no encontrada', 404);
  }
  if (params.newOnHand < variant.reserved) {
    throw new AppError(
      'invalid_stock_invariant',
      'El stock físico no puede ser menor a las unidades reservadas',
      400,
    );
  }

  const ids = deps.ids ?? cryptoIdGenerator;
  const clock = deps.clock ?? systemClock;
  const correctedAt = clock.now();

  await runBatch(db, [
    db
      .update(variants)
      .set({ onHand: params.newOnHand, updatedAt: correctedAt })
      .where(eq(variants.id, params.variantId)),
    db.insert(stockAuditLogs).values({
      id: ids.newToken(),
      variantId: params.variantId,
      previousOnHand: variant.onHand,
      newOnHand: params.newOnHand,
      reason,
      actorId: params.actorId ?? null,
      createdAt: correctedAt,
    }),
  ]);
}

export async function returnPaidOrderStock(db: Db, items: StockReservationItem[]): Promise<void> {
  assertPositiveQuantities(items);

  const updates = items.map((item) =>
    db
      .update(variants)
      .set({ onHand: sql`${variants.onHand} + ${item.quantity}` })
      .where(eq(variants.id, item.variantId)),
  );

  await runBatch(db, updates);
}
