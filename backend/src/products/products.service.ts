import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { UserRole } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any = {}) {
    const { page = 1, limit = 20, categoryId, search, featured, isActive, partnerId } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};

    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (featured) where.isFeatured = true;
    if (isActive !== undefined) where.isActive = isActive;
    if (partnerId) where.partnerId = partnerId;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          category: true,
          partner: { select: { id: true, storeName: true, storeLogo: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        partner: { select: { id: true, storeName: true, storeLogo: true } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findActive() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        partner: { select: { id: true, storeName: true, storeLogo: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findFeatured() {
    return this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        category: true,
        partner: { select: { id: true, storeName: true, storeLogo: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug || slugify(dto.name, { lower: true, strict: true });
    return this.prisma.product.create({
      data: { ...dto, slug },
      include: {
        category: true,
        partner: { select: { id: true, storeName: true, storeLogo: true } },
      },
    });
  }

  async update(id: string, dto: UpdateProductDto, user?: any) {
    const product = await this.findOne(id);
    if (user?.role === UserRole.PARTNER && product.partnerId !== user.id) {
      throw new ForbiddenException('Not your product');
    }
    const data: any = { ...dto };
    if (dto.name && !dto.slug) {
      data.slug = slugify(dto.name, { lower: true, strict: true });
    }
    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        partner: { select: { id: true, storeName: true, storeLogo: true } },
      },
    });
  }

  async remove(id: string, user?: any) {
    const product = await this.findOne(id);
    if (user?.role === UserRole.PARTNER && product.partnerId !== user.id) {
      throw new ForbiddenException('Not your product');
    }
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted' };
  }

  private async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
