import { IsString, IsOptional } from 'class-validator';

export class GoogleLoginDto {
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

export class AppleLoginDto {
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
