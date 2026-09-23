export type SpeiTransferRequest = {
  orderId: string;
  amountCentavos: number;
  idempotencyKey: string;
};

export type SpeiTransferResult = {
  ticketUrl: string;
  externalReference: string;
};

export type MercadoPagoOrderStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'rejected';

export type PaymentsPort = {
  createSpeiTransfer(input: SpeiTransferRequest): Promise<SpeiTransferResult>;
  getOrder(externalReference: string): Promise<{ status: MercadoPagoOrderStatus }>;
};
