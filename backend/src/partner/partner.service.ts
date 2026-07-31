import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';
import { encrypt, decrypt } from '../common/encryption';

@Injectable()
export class PartnerService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        storeName: true,
        storeDescription: true,
        storeLogo: true,
        cnpj: true,
        partnerStatus: true,
        commissionRate: true,
        mpUserId: true,
        _count: { select: { products: true, orders: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getMpAuthUrl(userId: string) {
    const clientId = this.configService.get('MERCADO_PAGO_CLIENT_ID');
    if (!clientId || clientId === 'your-mercado-pago-app-id') {
      throw new BadRequestException(
        'Mercado Pago não configurado. Configure as credenciais no arquivo .env do backend antes de vincular.',
      );
    }
    const redirectUri = `${this.configService.get('FRONTEND_URL')}/painel/conta`;
    return {
      url: `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}`,
    };
  }

  async linkMpAccount(userId: string, code: string) {
    const clientId = this.configService.get('MERCADO_PAGO_CLIENT_ID');
    const clientSecret = this.configService.get('MERCADO_PAGO_CLIENT_SECRET');
    const redirectUri = `${this.configService.get('FRONTEND_URL')}/painel/conta`;

    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) throw new Error('Failed to link Mercado Pago account');

    const data = await response.json();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mpUserId: data.user_id?.toString(),
        mpAccessToken: encrypt(data.access_token),
        mpRefreshToken: data.refresh_token ? encrypt(data.refresh_token) : undefined,
      },
    });

    return { mpUserId: data.user_id, linked: true };
  }

  async getMpStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mpUserId: true },
    });
    return { linked: !!user?.mpUserId };
  }

  async getEarnings(userId: string, query: any = {}) {
    const { page = 1, limit = 20 } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [earnings, total] = await Promise.all([
      this.prisma.partnerEarning.findMany({
        where: { partnerId: userId },
        skip,
        take: limitNum,
        include: {
          order: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.partnerEarning.count({ where: { partnerId: userId } }),
    ]);

    const totals = await this.prisma.partnerEarning.aggregate({
      where: { partnerId: userId },
      _sum: { amount: true, platformFee: true },
    });

    return {
      earnings,
      total,
      page: pageNum,
      limit: limitNum,
      totals: {
        totalEarned: totals._sum.amount || 0,
        totalPlatformFee: totals._sum.platformFee || 0,
      },
    };
  }

  async updateProfile(userId: string, dto: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        phone: true,
        storeName: true,
        storeDescription: true,
        storeLogo: true,
      },
    });
  }

  async getProducts(userId: string, query: any = {}) {
    const { page = 1, limit = 50 } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { partnerId: userId },
        skip,
        take: limitNum,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { partnerId: userId } }),
    ]);

    return { products, total, page: pageNum, limit: limitNum };
  }

  async createProduct(userId: string, dto: any) {
    const slug = dto.slug || slugify(dto.name, { lower: true, strict: true });
    return this.prisma.product.create({
      data: {
        ...dto,
        slug,
        partnerId: userId,
      },
      include: { category: true },
    });
  }

  async updateProduct(userId: string, productId: string, dto: any) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.partnerId !== userId) throw new ForbiddenException('Not your product');

    const data: any = { ...dto };
    if (dto.name && !dto.slug) {
      data.slug = slugify(dto.name, { lower: true, strict: true });
    }
    return this.prisma.product.update({
      where: { id: productId },
      data,
      include: { category: true },
    });
  }

  async deleteProduct(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.partnerId !== userId) throw new ForbiddenException('Not your product');
    await this.prisma.product.delete({ where: { id: productId } });
    return { message: 'Product deleted' };
  }

  async getOrders(userId: string, query: any = {}) {
    const { page = 1, limit = 20, status } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      items: {
        some: { product: { partnerId: userId } },
      },
    };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            where: { product: { partnerId: userId } },
            include: { product: true },
          },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page: pageNum, limit: limitNum };
  }

  async getDashboard(userId: string) {
    const [totalProducts, totalOrders, totalRevenue, earningsAgg] = await Promise.all([
      this.prisma.product.count({ where: { partnerId: userId } }),
      this.prisma.order.count({
        where: {
          items: { some: { product: { partnerId: userId } } },
        },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'DELIVERED',
          items: { some: { product: { partnerId: userId } } },
        },
      }),
      this.prisma.partnerEarning.aggregate({
        where: { partnerId: userId, status: 'AVAILABLE' },
        _sum: { amount: true },
      }),
    ]);

    return {
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalEarnings: earningsAgg._sum.amount || 0,
      },
    };
  }
}
