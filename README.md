# Delivery App

Aplicación de delivery de comida tipo marketplace, con tiendas de partners (vendedores), clientes y administración. Backend en NestJS con Prisma y frontend en Next.js.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Radix UI, shadcn/ui, Recharts, Zod |
| Backend | NestJS 10, Prisma ORM, Passport (JWT, Google, Apple), WebAuthn |
| Base de datos | PostgreSQL 16 |
| Pagos | Mercado Pago (checkout, marketplace, webhooks) |
| Infra | Docker Compose, Nginx (reverse proxy + SSL local) |

## Funcionalidades

- **Autenticación**: email/senha, Google OAuth, Apple Sign-In y passkeys (biometría / Face ID) via WebAuthn
- **Roles**: Cliente, Partner (vendedor), Admin, Super Admin
- **Marketplace**: productos, categorías, precios con descuento, stock, tiempo de preparación
- **Partners**: registro de tienda (CNPJ, logo, descripción), aprobación, comisión por venta y ganancias
- **Carrito y cupones**: carrito con notas por ítem, cupones (porcentaje o monto fijo, límites de uso)
- **Pedidos**: flujo completo de estado (pendiente → confirmado → preparando → listo → en camino → entregado), tarifa de envío, descuentos
- **Pagos**: Mercado Pago (tarjeta, PIX), split de pagos para partners (marketplace)
- **Direcciones**: múltiples direcciones con geolocalización y dirección predeterminada
- **Panel administrativo**: métricas con Recharts, gestión de productos/órdenes/usuarios
- **Seguridad**: Helmet, Throttler (rate limiting), JWT con refresh token, cookies

## Requisitos

- Node.js 18+
- Docker y Docker Compose (para PostgreSQL y deployment)
- Opcional: credenciales de Google, Apple y Mercado Pago

## Configuración

### 1. Variables de entorno

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` con las credenciales necesarias (JWT_SECRET obligatorio, el resto opcional).

### 2. Base de datos (Docker)

```bash
docker compose up -d postgres
```

### 3. Instalar dependencias

```bash
npm install
cd backend && npm install && cd ../frontend && npm install && cd ..
```

### 4. Migraciones y seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: `cd backend && npm run prisma:studio`

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Levanta backend y frontend en modo desarrollo |
| `npm run build` | Compila backend y frontend |
| `npm run start` | Ejecuta los builds en modo producción |
| `npm run db:migrate` | Ejecuta migraciones de Prisma |
| `npm run db:seed` | Ejecuta el seed de la base de datos |

## Deployment (Docker Compose)

```bash
# generar certificados SSL locales (una vez)
docker compose --profile setup run cert-gen

# construir y levantar todo
docker compose up -d --build
```

Nginx expone la aplicación en `https://localhost` (HTTP en el puerto 80).

## Estructura

```
├── backend/          # API NestJS (auth, products, orders, payments, partners)
│   ├── prisma/       # Schema y seed
│   └── src/          # Módulos de la aplicación
├── frontend/         # Aplicación Next.js
│   └── app/          # Páginas y componentes
├── nginx.conf        # Reverse proxy
└── docker-compose.yml
```
