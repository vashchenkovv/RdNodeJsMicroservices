import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class OrderDto {
  @IsString()
  userId!: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsBoolean()
  simulateUnavailableOnce?: boolean;
}
