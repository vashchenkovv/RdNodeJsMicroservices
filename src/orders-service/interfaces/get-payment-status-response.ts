import { PaymentStatus } from '../enums/payment-status.enum';

export interface GetPaymentStatusResponse {
  paymentId: string;
  status: PaymentStatus;
  orderId: string;
}
