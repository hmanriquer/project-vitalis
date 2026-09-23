import type { MailPort } from '@/worker/features/mail/port';
import type { PaymentsPort } from '@/worker/features/payments/port';
import { AppError } from '@/worker/lib/errors';
import { type Clock, createFakeClock, systemClock } from '@/worker/services/clock';
import {
  createSequentialIdGenerator,
  cryptoIdGenerator,
  type IdGenerator,
} from '@/worker/services/ids';

export type Services = {
  clock: Clock;
  ids: IdGenerator;
  payments: PaymentsPort;
  mail: MailPort;
};

const stubPayments: PaymentsPort = {
  async createSpeiTransfer() {
    throw new AppError('not_implemented', 'Pagos no implementados', 501);
  },
  async getOrder() {
    throw new AppError('not_implemented', 'Pagos no implementados', 501);
  },
};

const stubMail: MailPort = {
  async send() {
    throw new AppError('not_implemented', 'Correo no implementado', 501);
  },
};

export function createDefaultServices(overrides: Partial<Services> = {}): Services {
  return {
    clock: systemClock,
    ids: cryptoIdGenerator,
    payments: stubPayments,
    mail: stubMail,
    ...overrides,
  };
}

export { createFakeClock, createSequentialIdGenerator };
