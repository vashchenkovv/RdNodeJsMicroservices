import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AuthorizeResponse } from './interfaces/authorize-response';
import { PaymentsGrpcClient } from './payments-grpc.client';
import { OrderDto } from './dto/order.dto';
import { randomUUID } from 'crypto';
import { GetPaymentStatusResponse } from './interfaces/get-payment-status-response';

@Controller('orders')
export class OrdersControllet {
  private logger = new Logger(OrdersControllet.name);

  constructor(private readonly paymentsGrpcClient: PaymentsGrpcClient) {}

  @Post(':orderId/pay')
  async payOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() orderDto: OrderDto,
  ): Promise<AuthorizeResponse> {
    this.logger.log(
      `Pay order [orderId]: ${orderId} [userId]: ${orderDto.userId} [amount]: ${orderDto.amount}`,
    );
    return this.paymentsGrpcClient.authorize({
      orderId,
      userId: orderDto.userId,
      total: {
        amount: `${orderDto.amount}`,
        currency: orderDto.currency,
      },
      idempotencyKey: orderDto.idempotencyKey ?? randomUUID(),
      simulateUnavailableOnce: orderDto.simulateUnavailableOnce || false,
    });
  }

  @Get('payments/:paymentId/status')
  async paymentStatus(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ): Promise<GetPaymentStatusResponse> {
    return this.paymentsGrpcClient.getStatus(paymentId);
  }
}
