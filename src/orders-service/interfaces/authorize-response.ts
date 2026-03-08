import { PaymentStatus } from '../enums/payment-status.enum';

export interface AuthorizeResponse {
  paymentId: string;
  status: PaymentStatus;
  message: string;
}
