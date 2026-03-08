import { Controller } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import type { AuthorizeRequest } from './interfaces/authorize-request';
import { status as GrpcStatus } from '@grpc/grpc-js';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @GrpcMethod('PaymentsService', 'Authorize')
  authorize(payload: AuthorizeRequest) {
    if (!payload.orderId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'order_id is required',
      });
    }

    if (
      this.paymentsService.shouldFailTransient(
        payload.orderId,
        payload.simulateUnavailableOnce,
      )
    ) {
      throw new RpcException({
        code: GrpcStatus.UNAVAILABLE,
        message: 'transient provider outage',
      });
    }

    const result = this.paymentsService.authorize(payload);

    return result;
  }

  @GrpcMethod('PaymentsService', 'GetPaymentStatus')
  getPaymentStatus(payload: { paymentId: string }) {
    const payment = this.paymentsService.getStatus(payload.paymentId);

    if (!payment) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: 'payment not found',
      });
    }

    return payment;
  }
}
