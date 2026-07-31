import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCardPaymentDto {
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsString()
  @IsOptional()
  issuerId?: string;

  @IsNumber()
  @IsOptional()
  installments?: number;

  @IsString()
  @IsOptional()
  identificationType?: string;

  @IsString()
  @IsOptional()
  identificationNumber?: string;
}

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsString()
  @IsOptional()
  issuerId?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsNumber()
  @IsOptional()
  installments?: number;

  @IsString()
  @IsOptional()
  payerEmail?: string;
}

export class ProcessPaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  paymentMethod: string;
}
