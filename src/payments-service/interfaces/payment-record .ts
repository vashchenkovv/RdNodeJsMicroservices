import { PaymentStatus } from '../enums/payment-status.enum';

export interface PaymentRecord {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  failureReason?: string;
}
