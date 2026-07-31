import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, UserRole, PartnerStatus } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders, statusCounts] =
      await Promise.all([
        this.prisma.order.count(),
        this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { status: 'DELIVERED' },
        }),
        this.prisma.user.count(),
        this.prisma.product.count(),
        this.prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          _count: true,
        }),
      ]);

    const ordersByStatus = statusCounts.reduce(
      (acc, curr) => ({ ...acc, [curr.status]: curr._count }),
      {},
    );

    return {
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalUsers,
        totalProducts,
      },
      ordersByStatus,
      recentOrders,
    };
  }

  async getOrders(query: any) {
    const { page = 1, limit = 20, status, search } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page: pageNum, limit: limitNum };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
        address: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        deliveredAt: status === 'DELIVERED' ? new Date() : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getUsers(query: any) {
    const { page = 1, limit = 20, search } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          storeName: true,
          partnerStatus: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page: pageNum, limit: limitNum };
  }

  async updateUserRole(id: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  async toggleUserStatus(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, name: true, isActive: true },
    });
  }

  async getProducts(query: any) {
    const { page = 1, limit = 50, categoryId } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          category: true,
          partner: { select: { id: true, storeName: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page: pageNum, limit: limitNum };
  }

  async createProduct(dto: any) {
    const slug = dto.slug || slugify(dto.name, { lower: true, strict: true });
    return this.prisma.product.create({
      data: { ...dto, slug },
      include: {
        category: true,
        partner: { select: { id: true, storeName: true } },
      },
    });
  }

  async updateProduct(id: string, dto: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    const data: any = { ...dto };
    if (dto.name && !dto.slug) {
      data.slug = slugify(dto.name, { lower: true, strict: true });
    }
    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        partner: { select: { id: true, storeName: true } },
      },
    });
  }

  async deleteProduct(id: string) {
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted' };
  }

  async getCategories() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async createCategory(dto: any) {
    const slug = dto.slug || slugify(dto.name, { lower: true, strict: true });
    return this.prisma.category.create({ data: { ...dto, slug } });
  }

  async updateCategory(id: string, dto: any) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    const data: any = { ...dto };
    if (dto.name && !dto.slug) {
      data.slug = slugify(dto.name, { lower: true, strict: true });
    }
    return this.prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }

  async getCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(dto: any) {
    return this.prisma.coupon.create({ data: dto });
  }

  async updateCoupon(id: string, dto: any) {
    return this.prisma.coupon.update({ where: { id }, data: dto });
  }

  async deleteCoupon(id: string) {
    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted' };
  }

  async getReports(query: any) {
    const { startDate, endDate } = query;
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalOrders, totalRevenue, ordersByDay, topProducts] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { ...where, status: 'DELIVERED' },
      }),
      this.prisma.$queryRaw<Array<{ date: Date; count: bigint; revenue: Prisma.Decimal }>>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count, SUM("totalAmount") as revenue
        FROM "orders"
        WHERE ${startDate ? Prisma.sql`"createdAt" >= ${new Date(startDate)}` : Prisma.sql`1=1`}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      `,
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      ordersByDay,
      topProducts,
    };
  }

  async getPartners(query: any) {
    const { page = 1, limit = 20, status, search } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const where: any = { role: UserRole.PARTNER };

    if (status) where.partnerStatus = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { storeName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [partners, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          storeName: true,
          storeDescription: true,
          cnpj: true,
          partnerStatus: true,
          isActive: true,
          createdAt: true,
          _count: { select: { products: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { partners, total, page: pageNum, limit: limitNum };
  }

  async approvePartner(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { partnerStatus: PartnerStatus.APPROVED },
      select: { id: true, name: true, storeName: true, partnerStatus: true },
    });
  }

  async rejectPartner(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { partnerStatus: PartnerStatus.REJECTED },
      select: { id: true, name: true, storeName: true, partnerStatus: true },
    });
  }
}
