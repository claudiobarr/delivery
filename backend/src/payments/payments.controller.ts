import { Controller, Post, Get, Body, Param, UseGuards, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCardPaymentDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('public-key')
  getPublicKey() {
    return this.paymentsService.getPublicKey();
  }

  @Post('pix/:orderId')
  @UseGuards(JwtAuthGuard)
  createPixPayment(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.paymentsService.createPixPayment(orderId, user.id);
  }

  @Post('card/:orderId')
  @UseGuards(JwtAuthGuard)
  createCardPayment(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() cardData: CreateCardPaymentDto,
  ) {
    return this.paymentsService.createCardPayment(orderId, user.id, cardData);
  }

  @Post('webhook')
  handleWebhook(@Body() data: any, @Headers('x-signature') signature?: string) {
    return this.paymentsService.handleWebhook(data, signature);
  }
}
