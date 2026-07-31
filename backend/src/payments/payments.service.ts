import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { v4 as uuid } from 'uuid';
import * as crypto from 'crypto';
import { decrypt } from '../common/encryption';

@Injectable()
export class PaymentsService {
  private mpClient: MercadoPagoConfig;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const token = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN') || '';
    this.mpClient = new MercadoPagoConfig({ accessToken: token });
  }

  private async getOrderWithPartners(orderId: string, userId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                partner: {
                  select: {
                    id: true,
                    storeName: true,
                    mpUserId: true,
                    mpAccessToken: true,
                    commissionRate: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private getPartnerForSplit(order: any): { partner: any; subtotal: number } | null {
    const partnerIds = new Set(order.items.map((i: any) => i.product.partnerId).filter(Boolean));
    if (partnerIds.size !== 1) return null;

    const partnerId = [...partnerIds][0];
    const item = order.items.find((i: any) => i.product.partnerId === partnerId);
    if (!item?.product?.partner?.mpAccessToken) return null;

    const subtotal = order.items
      .filter((i: any) => i.product.partnerId === partnerId)
      .reduce((sum: number, i: any) => sum + Number(i.unitPrice) * i.quantity, 0);

    return { partner: item.product.partner, subtotal };
  }

  private async createMarketplacePayment(order: any, partner: any, paymentMethod: string, extraData?: any, userId?: string) {
    const platformUserId = this.configService.get('MERCADO_PAGO_MARKETPLACE_USER_ID');
    const commissionRate = partner.commissionRate || 10;
    const platformFee = Math.round(Number(order.totalAmount) * (commissionRate / 100) * 100) / 100;
    const amountForPartner = Number(order.totalAmount) - platformFee;

    const partnerConfig = new MercadoPagoConfig({ accessToken: decrypt(partner.mpAccessToken) });
    const payment = new Payment(partnerConfig);
    const idempotencyKey = uuid();

    const baseData: any = {
      transaction_amount: Number(order.totalAmount),
      description: `Pedido #${order.id.slice(0, 8)}`,
      payer: { email: order.user.email },
      marketplace: platformUserId,
      platform_fee: platformFee,
      notification_url: `${this.configService.get('FRONTEND_URL')}/api/payments/webhook`,
    };

    if (paymentMethod === 'pix') {
      baseData.payment_method_id = 'pix';
    } else if (paymentMethod === 'card' && extraData) {
      baseData.token = extraData.token;
      baseData.installments = extraData.installments || 1;
      baseData.payment_method_id = extraData.paymentMethodId;
      baseData.issuer_id = extraData.issuerId;
      baseData.payer.identification = {
        type: extraData.identificationType || 'CPF',
        number: extraData.identificationNumber || '',
      };
    }

    try {
      const result = await payment.create({ body: baseData, requestOptions: { idempotencyKey } });

      const paymentId = result.id?.toString();
      if (paymentId) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            paymentId,
            platformFee,
            paymentStatus: result.status === 'approved' ? PaymentStatus.APPROVED : PaymentStatus.PENDING,
          },
        });

        if (result.status === 'approved') {
          await this.createPartnerEarning(order.id, partner.id, amountForPartner, platformFee);
        }
      }

      return { paymentId: result.id, status: result.status, isMarketplaceSplit: true };
    } catch (error) {
      throw new BadRequestException(`Payment failed: ${error.message}`);
    }
  }

  private async createPartnerEarning(orderId: string, partnerId: string, amount: number, platformFee: number) {
    const existing = await this.prisma.partnerEarning.findFirst({
      where: { orderId, partnerId },
    });
    if (!existing) {
      await this.prisma.partnerEarning.create({
        data: {
          orderId,
          partnerId,
          amount,
          platformFee,
          status: 'AVAILABLE',
        },
      });
    }
  }

  async createPixPayment(orderId: string, userId: string) {
    const order = await this.getOrderWithPartners(orderId, userId);
    if (!order) throw new BadRequestException('Order not found');

    const splitInfo = this.getPartnerForSplit(order);
    if (splitInfo) {
      return this.createMarketplacePayment(order, splitInfo.partner, 'pix', undefined, userId);
    }

    const payment = new Payment(this.mpClient);
    const idempotencyKey = uuid();

    const result = await payment.create({
      body: {
        transaction_amount: Number(order.totalAmount),
        description: `Pedido #${order.id.slice(0, 8)}`,
        payment_method_id: 'pix',
        payer: { email: order.user.email, first_name: order.user.name || 'Cliente' },
        notification_url: `${this.configService.get('FRONTEND_URL')}/api/payments/webhook`,
      },
      requestOptions: { idempotencyKey },
    });

    const paymentId = result.id?.toString();
    if (paymentId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { paymentId, paymentStatus: PaymentStatus.PENDING },
      });
    }

    return {
      paymentId: result.id,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticketUrl: result.point_of_interaction?.transaction_data?.ticket_url,
      status: result.status,
    };
  }

  async createCardPayment(orderId: string, userId: string, cardData: any) {
    const order = await this.getOrderWithPartners(orderId, userId);
    if (!order) throw new BadRequestException('Order not found');

    const splitInfo = this.getPartnerForSplit(order);
    if (splitInfo) {
      return this.createMarketplacePayment(order, splitInfo.partner, 'card', cardData, userId);
    }

    const payment = new Payment(this.mpClient);
    const idempotencyKey = uuid();

    const result = await payment.create({
      body: {
        transaction_amount: Number(order.totalAmount),
        token: cardData.token,
        description: `Pedido #${order.id.slice(0, 8)}`,
        installments: cardData.installments || 1,
        payment_method_id: cardData.paymentMethodId,
        issuer_id: cardData.issuerId,
        payer: {
          email: order.user.email,
          identification: { type: cardData.identificationType || 'CPF', number: cardData.identificationNumber || '' },
        },
        notification_url: `${this.configService.get('FRONTEND_URL')}/api/payments/webhook`,
      },
      requestOptions: { idempotencyKey },
    });

    const paymentId = result.id?.toString();
    if (paymentId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentId,
          paymentStatus: result.status === 'approved' ? PaymentStatus.APPROVED : PaymentStatus.PENDING,
        },
      });
    }

    return { paymentId: result.id, status: result.status, statusDetail: result.status_detail };
  }

  async handleWebhook(data: any, signature?: string) {
    const webhookSecret = this.configService.get('MERCADO_PAGO_WEBHOOK_SECRET');
    if (webhookSecret) {
      if (!signature) {
        throw new BadRequestException('Missing webhook signature');
      }
      const payload = JSON.stringify(data);
      const expectedSig = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
      if (signature !== expectedSig) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    if (data.type === 'payment') {
      const paymentId = data.data.id;
      const payment = new Payment(this.mpClient);

      try {
        const paymentInfo = await payment.get({ id: paymentId });

        const order = await this.prisma.order.findFirst({
          where: { paymentId: paymentId.toString() },
          include: {
            items: { include: { product: { select: { partnerId: true } } } },
          },
        });

        if (order) {
          const statusMap: Record<string, PaymentStatus> = {
            approved: PaymentStatus.APPROVED,
            rejected: PaymentStatus.REFUSED,
            cancelled: PaymentStatus.CANCELLED,
            refunded: PaymentStatus.REFUNDED,
          };

          const newStatus = (paymentInfo.status && statusMap[paymentInfo.status]) || PaymentStatus.PENDING;
          const wasApproved = newStatus === PaymentStatus.APPROVED && order.paymentStatus !== PaymentStatus.APPROVED;

          await this.prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: newStatus },
          });

          if (wasApproved) {
            const partnerIds: string[] = order.items
              .map((i: any) => i.product.partnerId)
              .filter((id: string | null): id is string => !!id);
            const uniquePartners = [...new Set(partnerIds)];
            for (const partnerId of uniquePartners) {
              const existingEarning = await this.prisma.partnerEarning.findFirst({
                where: { orderId: order.id, partnerId },
              });
              if (!existingEarning) {
                const partner = await this.prisma.user.findUnique({
                  where: { id: partnerId },
                  select: { commissionRate: true },
                });
                const rate = partner?.commissionRate || 10;
                const itemsForPartner = order.items.filter((i: any) => i.product.partnerId === partnerId);
                const subtotal = itemsForPartner.reduce((s: number, i: any) => s + Number(i.unitPrice) * i.quantity, 0);
                const totalAmt = Number(order.totalAmount);
                const shareOfOrder = totalAmt > 0 ? subtotal / totalAmt : 0;
                const platformFee = Math.round(totalAmt * (rate / 100) * shareOfOrder * 100) / 100;
                const amount = Math.round((subtotal - platformFee) * 100) / 100;

                await this.prisma.partnerEarning.create({
                  data: { orderId: order.id, partnerId, amount, platformFee, status: 'AVAILABLE' },
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Webhook processing error:', error);
      }
    }
    return { received: true };
  }

  async getPublicKey() {
    return { publicKey: this.configService.get('MERCADO_PAGO_PUBLIC_KEY') };
  }
}
