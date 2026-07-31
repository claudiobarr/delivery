import { PrismaClient, UserRole, PartnerStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@delivery.com' },
    update: {},
    create: {
      email: 'admin@delivery.com',
      password: adminPassword,
      name: 'Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  const partnerPassword = await bcrypt.hash('partner123', 10);

  const partner = await prisma.user.upsert({
    where: { email: 'partner@delivery.com' },
    update: {},
    create: {
      email: 'partner@delivery.com',
      password: partnerPassword,
      name: 'João Parceiro',
      phone: '(11) 99999-0001',
      role: UserRole.PARTNER,
      storeName: 'Hamburgueria do João',
      storeDescription: 'Os melhores hambúrgueres artesanais da cidade',
      cnpj: '12.345.678/0001-90',
      partnerStatus: PartnerStatus.APPROVED,
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'hamburgueres' },
      update: {},
      create: { name: 'Hambúrgueres', slug: 'hamburgueres', description: 'Hambúrgueres artesanais', orderIndex: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'pizzas' },
      update: {},
      create: { name: 'Pizzas', slug: 'pizzas', description: 'Pizzas especiais', orderIndex: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'bebidas' },
      update: {},
      create: { name: 'Bebidas', slug: 'bebidas', description: 'Refrigerantes, sucos e mais', orderIndex: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'acompanhamentos' },
      update: {},
      create: { name: 'Acompanhamentos', slug: 'acompanhamentos', description: 'Batatas, onion rings e mais', orderIndex: 4 },
    }),
    prisma.category.upsert({
      where: { slug: 'sobremesas' },
      update: {},
      create: { name: 'Sobremesas', slug: 'sobremesas', description: 'Doces e sobremesas', orderIndex: 5 },
    }),
  ]);

  const products = [
    { name: 'X-Tudo', slug: 'x-tudo', price: 29.90, categoryId: categories[0].id, partnerId: partner.id, description: 'Hambúrguer com tudo que tem direito', ingredients: 'Pão, hambúrguer 180g, queijo, bacon, ovo, alface, tomate, batata palha', preparationTime: 20 },
    { name: 'X-Bacon', slug: 'x-bacon', price: 25.90, categoryId: categories[0].id, partnerId: partner.id, description: 'Hambúrguer com bacon crocante', ingredients: 'Pão, hambúrguer 150g, queijo, bacon, alface, tomate', preparationTime: 15 },
    { name: 'X-Salada', slug: 'x-salada', price: 19.90, categoryId: categories[0].id, partnerId: partner.id, description: 'Hambúrguer clássico com salada', ingredients: 'Pão, hambúrguer 120g, queijo, alface, tomate, maionese', preparationTime: 12 },
    { name: 'Pizza Calabresa', slug: 'pizza-calabresa', price: 39.90, categoryId: categories[1].id, description: 'Pizza de calabresa com cebola', ingredients: 'Molho, mussarela, calabresa, cebola, azeitona', preparationTime: 30 },
    { name: 'Pizza Margherita', slug: 'pizza-margherita', price: 35.90, categoryId: categories[1].id, description: 'Pizza margherita tradicional', ingredients: 'Molho, mussarela, tomate, manjericão', preparationTime: 25 },
    { name: 'Coca-Cola 350ml', slug: 'coca-cola-350ml', price: 5.90, categoryId: categories[2].id, isFeatured: true },
    { name: 'Suco de Laranja', slug: 'suco-laranja', price: 7.90, categoryId: categories[2].id, description: 'Suco natural de laranja', preparationTime: 5 },
    { name: 'Batata Frita', slug: 'batata-frita', price: 14.90, discountedPrice: 11.90, categoryId: categories[3].id, description: 'Batata frita crocante', ingredients: 'Batata, sal', preparationTime: 10, isFeatured: true },
    { name: 'Onion Rings', slug: 'onion-rings', price: 12.90, categoryId: categories[3].id, description: 'Anéis de cebola empanados', preparationTime: 8 },
    { name: 'Petit Gateau', slug: 'petit-gateau', price: 18.90, categoryId: categories[4].id, description: 'Petit gateau com sorvete', preparationTime: 15, isFeatured: true },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  const coupon = await prisma.coupon.upsert({
    where: { code: 'BEMVINDO' },
    update: {},
    create: {
      code: 'BEMVINDO',
      description: '10% de desconto na primeira compra',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: 100,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
