import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } }, coupon: true },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.product.discountedPrice || item.product.price) * item.quantity,
      0,
    );
    let discountAmount = 0;

    if (cart.coupon) {
      if (cart.coupon.discountType === 'PERCENTAGE') {
        discountAmount = (totalAmount * Number(cart.coupon.discountValue)) / 100;
      } else {
        discountAmount = Number(cart.coupon.discountValue);
      }
      totalAmount -= discountAmount;

      await this.prisma.coupon.update({
        where: { id: cart.coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const itemsData = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.product.discountedPrice || item.product.price,
      notes: item.notes,
    }));

    const order = await this.prisma.order.create({
      data: {
        userId,
        addressId: dto.addressId,
        totalAmount,
        discountAmount,
        deliveryFee: 0,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
        couponId: cart.couponId,
        status: OrderStatus.PENDING,
        items: { create: itemsData },
      },
      include: {
        items: { include: { product: { select: { id: true, partnerId: true, price: true } } } },
        address: true,
      },
    });

    const partnerMap = new Map<string, { subtotal: number; commissionRate: number }>();
    for (const item of order.items) {
      if (item.product.partnerId) {
        if (!partnerMap.has(item.product.partnerId)) {
          const partner = await this.prisma.user.findUnique({
            where: { id: item.product.partnerId },
            select: { commissionRate: true },
          });
          partnerMap.set(item.product.partnerId, {
            subtotal: 0,
            commissionRate: partner?.commissionRate || 10,
          });
        }
        const p = partnerMap.get(item.product.partnerId)!;
        p.subtotal += Number(item.unitPrice) * item.quantity;
      }
    }

    for (const [partnerId, info] of partnerMap) {
      const shareOfTotal = totalAmount > 0 ? info.subtotal / totalAmount : 0;
      const platformFee = Math.round(totalAmount * (info.commissionRate / 100) * shareOfTotal * 100) / 100;
      const partnerAmount = Math.round((info.subtotal - platformFee) * 100) / 100;

      await this.prisma.partnerEarning.create({
        data: {
          orderId: order.id,
          partnerId,
          amount: partnerAmount,
          platformFee,
          status: 'PENDING',
        },
      });

      await this.prisma.order.update({
        where: { id: order.id },
        data: { platformFee: { increment: platformFee } },
      });
    }

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    });

    return this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { product: { include: { category: true } } } },
        address: true,
      },
    });
  }

  async findAll(userId?: string, query: any = {}) {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: { include: { product: true } },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        address: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
      },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    });
  }

  async cancel(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async getOrderByUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
