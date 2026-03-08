import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PaymentsGrpcService } from './interfaces/payments-grpc-service';
import type { ClientGrpc } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AuthorizeRequest } from './interfaces/authorize-request';
import { AuthorizeResponse } from './interfaces/authorize-response';
import { firstValueFrom, retry, timeout, timer } from 'rxjs';
import { GetPaymentStatusResponse } from './interfaces/get-payment-status-response';
import { status as GrpcStatus } from '@grpc/grpc-js';

@Injectable()
export class PaymentsGrpcClient implements OnModuleInit {
  private logger = new Logger(PaymentsGrpcClient.name);
  private paymentsService!: PaymentsGrpcService;
  private timeoutMs = 2500;
  private maxRetries = 2;
  private baseBackoffMs = 150;

  constructor(
    @Inject('PAYMENTS_GRPC_CLIENT') private client: ClientGrpc,
    private configService: ConfigService,
  ) {}

  onModuleInit(): void {
    this.paymentsService =
      this.client.getService<PaymentsGrpcService>('PaymentsService');

    this.timeoutMs = Number(
      this.configService.get<string>('PAYMENTS_RPC_TIMEOUT_MS') ?? '2500',
    );

    this.maxRetries = Number(
      this.configService.get<string>('PAYMENTS_RPC_MAX_RETRIES') ?? '2',
    );

    this.baseBackoffMs = Number(
      this.configService.get<string>('PAYMENTS_RPC_BACKOFF_MS') ?? '150',
    );
  }

  async authorize(payload: AuthorizeRequest): Promise<AuthorizeResponse> {
    this.logger.log(`authorize start`);
    try {
      const res = await firstValueFrom(
        this.paymentsService.Authorize(payload).pipe(
          timeout(this.timeoutMs),
          retry({
            count: this.maxRetries,
            delay: (error, retryIndex) => {
              const delayMs = this.baseBackoffMs * Math.pow(2, retryIndex - 1);
              const code = (error as { code?: number })?.code;
              this.logger.warn(
                `retry authorize attempt=${retryIndex} code=${String(code)} delayMs=${delayMs}`,
              );
              return timer(delayMs);
            },
          }),
        ),
      );

      this.logger.log(`authorize gRPS success`);

      return res;
    } catch (error) {
      this.logger.error(`authorize failed orderId=${payload.orderId}`);
      throw this.mapGrpcError(error);
    }
  }

  async getStatus(paymentId: string): Promise<GetPaymentStatusResponse> {
    this.logger.log(`Get Status start`);
    try {
      const res = await firstValueFrom(
        this.paymentsService.GetPaymentStatus({ paymentId }).pipe(
          timeout(this.timeoutMs),
          retry({
            count: this.maxRetries,
            delay: (error, retryIndex) => {
              const delayMs = this.baseBackoffMs * Math.pow(2, retryIndex - 1);
              const code = (error as { code?: number })?.code;
              this.logger.warn(
                `retry get status attempt=${retryIndex} code=${String(code)} delayMs=${delayMs}`,
              );
              return timer(delayMs);
            },
          }),
        ),
      );

      this.logger.log(`get status gRPS success`);
      return res;
    } catch (error) {
      this.logger.error(`status failed paymentId=${paymentId}`);
      throw this.mapGrpcError(error);
    }
  }

  private mapGrpcError(error: unknown): Error {
    const code = (error as { code?: number })?.code;
    const details =
      (error as { details?: string; message?: string })?.details ??
      (error as { message?: string })?.message ??
      'unknown grpc error';

    if (code === GrpcStatus.INVALID_ARGUMENT) {
      return new BadRequestException(`Payments validation failed: ${details}`);
    }

    if (code === GrpcStatus.NOT_FOUND) {
      return new NotFoundException(`Payment not found: ${details}`);
    }

    if (code === GrpcStatus.FAILED_PRECONDITION) {
      return new ConflictException(
        `Payment cannot be processed now: ${details}`,
      );
    }

    if (code === GrpcStatus.DEADLINE_EXCEEDED) {
      return new GatewayTimeoutException(`Payments timeout: ${details}`);
    }

    if (code === GrpcStatus.UNAVAILABLE) {
      return new ServiceUnavailableException(
        `Payments temporarily unavailable: ${details}`,
      );
    }

    return new BadGatewayException(`Payments RPC call failed: ${details}`);
  }
}
