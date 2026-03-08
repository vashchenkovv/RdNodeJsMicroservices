import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OrdersControllet } from './orders.controller';
import { PaymentsGrpcClient } from './payments-grpc.client';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: 'PAYMENTS_GRPC_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          return {
            transport: Transport.GRPC,
            options: {
              package: 'payments',
              protoPath: join(process.cwd(), 'proto', 'payments.proto'),
              url: configService.get<string>(
                'PAYMENTS_GRPC_URL',
                'localhost:5021',
              ),
            },
          };
        },
      },
    ]),
  ],
  controllers: [OrdersControllet],
  providers: [PaymentsGrpcClient],
})
export class OrdersModule {}
