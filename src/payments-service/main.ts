import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PaymentsModule } from './payments.module';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

async function bootstrap() {
  const configService = new ConfigService();
  const url = configService.get<string>(
    'PAYMENTS_GRPC_BIND_URL',
    '0.0.0.0:5021',
  );

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentsModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'payments',
        protoPath: join(process.cwd(), 'proto', 'payments.proto'),
        url,
      },
    },
  );
  await app.listen();
}
bootstrap();
