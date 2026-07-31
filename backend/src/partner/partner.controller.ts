import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PartnerService } from './partner.service';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UpdatePartnerProfileDto } from '../partner/dto/update-profile.dto';
import { CreateProductDto, UpdateProductDto } from '../products/dto/create-product.dto';

@Controller('partner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARTNER)
export class PartnerController {
  constructor(private partnerService: PartnerService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: any) {
    return this.partnerService.getDashboard(user.id);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.partnerService.getProfile(user.id);
  }

  @Put('profile')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdatePartnerProfileDto) {
    return this.partnerService.updateProfile(user.id, dto);
  }

  @Get('products')
  getProducts(@CurrentUser() user: any, @Query() query: any) {
    return this.partnerService.getProducts(user.id, query);
  }

  @Post('products')
  createProduct(@CurrentUser() user: any, @Body() dto: CreateProductDto) {
    return this.partnerService.createProduct(user.id, dto);
  }

  @Put('products/:id')
  updateProduct(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.partnerService.updateProduct(user.id, id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@CurrentUser() user: any, @Param('id') id: string) {
    return this.partnerService.deleteProduct(user.id, id);
  }

  @Get('orders')
  getOrders(@CurrentUser() user: any, @Query() query: any) {
    return this.partnerService.getOrders(user.id, query);
  }

  @Get('mp/auth-url')
  getMpAuthUrl(@CurrentUser() user: any) {
    return this.partnerService.getMpAuthUrl(user.id);
  }

  @Post('mp/link')
  linkMpAccount(@CurrentUser() user: any, @Body('code') code: string) {
    return this.partnerService.linkMpAccount(user.id, code);
  }

  @Get('mp/status')
  getMpStatus(@CurrentUser() user: any) {
    return this.partnerService.getMpStatus(user.id);
  }

  @Get('earnings')
  getEarnings(@CurrentUser() user: any, @Query() query: any) {
    return this.partnerService.getEarnings(user.id, query);
  }
}
