import { Injectable } from '@nestjs/common';
import { AuthorizeRequest } from './interfaces/authorize-request';
import { AuthorizeResponse } from './interfaces/authorize-response';
import { randomUUID } from 'crypto';
import { PaymentRecord } from './interfaces/payment-record ';
import { PaymentStatus } from './enums/payment-status.enum';

@Injectable()
export class PaymentsService {
  private idempotencyResults = new Map<string, AuthorizeResponse>();
  private paymentsById = new Map<string, PaymentRecord>();
  private transientFailOnceGate = new Set<string>();

  authorize(payload: AuthorizeRequest): AuthorizeResponse {
    if (
      payload.idempotencyKey &&
      this.idempotencyResults.has(payload.idempotencyKey)
    ) {
      return this.idempotencyResults.get(payload.idempotencyKey)!;
    }

    const paymentId = randomUUID();

    const result: AuthorizeResponse = {
      paymentId,
      status: PaymentStatus.PAYMENT_STATUS_AUTHORIZED,
      message: 'Payment authorized',
    };

    this.paymentsById.set(paymentId, {
      paymentId,
      orderId: payload.orderId,
      status: PaymentStatus.PAYMENT_STATUS_AUTHORIZED,
    });

    if (payload.idempotencyKey) {
      this.idempotencyResults.set(payload.idempotencyKey, result);
    }

    return result;
  }

  getStatus(paymentId: string): PaymentRecord | null {
    return this.paymentsById.get(paymentId) ?? null;
  }

  shouldFailTransient(
    orderId: string,
    simulateUnavailableOnce?: boolean,
  ): boolean {
    if (!simulateUnavailableOnce) {
      return false;
    }

    if (this.transientFailOnceGate.has(orderId)) {
      return false;
    }

    this.transientFailOnceGate.add(orderId);
    return true;
  }
}
