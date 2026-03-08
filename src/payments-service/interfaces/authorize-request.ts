import { Money } from './money';

export interface AuthorizeRequest {
  orderId: string;
  userId: string;
  total: Money;
  idempotencyKey: string;
  simulateUnavailableOnce: boolean;
}
