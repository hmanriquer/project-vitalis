import { AppError } from '@/worker/lib/errors';

export type StockReservationItem = {
  variantId: string;
  quantity: number;
};

export class StockShortageError extends AppError {
  readonly variantId: string;
  readonly requested: number;
  readonly available: number;

  constructor(variantId: string, requested: number, available: number) {
    super('stock_shortage', 'No hay unidades disponibles suficientes', 409, {
      variantId,
      requested,
      available,
    });
    this.name = 'StockShortageError';
    this.variantId = variantId;
    this.requested = requested;
    this.available = available;
  }
}

export class InvalidStockOperationError extends AppError {
  constructor(message = 'Operación de stock no permitida', details?: unknown) {
    super('invalid_stock_operation', message, 409, details);
    this.name = 'InvalidStockOperationError';
  }
}
