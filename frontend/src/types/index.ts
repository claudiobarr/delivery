export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'PARTNER';
  avatarUrl?: string;
  isActive?: boolean;
  storeName?: string;
  storeDescription?: string;
  storeLogo?: string;
  cnpj?: string;
  partnerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export interface Address {
  id: string;
  userId: string;
  label?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  orderIndex: number;
  products?: Product[];
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discountedPrice?: number;
  imageUrl?: string;
  images: string[];
  categoryId: string;
  category?: Category;
  partnerId?: string;
  partner?: { id: string; storeName?: string; storeLogo?: string };
  isActive: boolean;
  isFeatured: boolean;
  preparationTime?: number;
  ingredients?: string;
  stockQuantity: number;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  notes?: string;
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  couponId?: string;
  coupon?: Coupon;
}

export interface Order {
  id: string;
  userId: string;
  addressId?: string;
  address?: Address;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  discountAmount: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  notes?: string;
  couponId?: string;
  estimatedTime?: number;
  deliveredAt?: string;
  items: OrderItem[];
  user?: { id: string; name?: string; email: string; phone?: string };
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  product: Product;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'MERCADO_PAGO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REFUSED' | 'CANCELLED' | 'REFUNDED';

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
