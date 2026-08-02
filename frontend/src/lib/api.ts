const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: any) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(path: string, body?: any) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body?: any) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // Auth
  login(email: string, password: string) {
    return this.post<{ user: any }>('/auth/login', { email, password });
  }

  register(data: { email: string; password: string; name?: string; phone?: string }) {
    return this.post<{ user: any }>('/auth/register', data);
  }

  googleLogin(token: string) {
    return this.post<{ user: any }>('/auth/google', { token });
  }

  appleLogin(token: string) {
    return this.post<{ user: any }>('/auth/apple', { token });
  }

  logout() {
    return this.post<{ message: string }>('/auth/logout');
  }

  getProfile() {
    return this.get<any>('/auth/me');
  }

  // Passkeys (biometria / Face ID)
  passkeyRegisterOptions() {
    return this.post<any>('/auth/passkeys/register/options');
  }

  passkeyRegisterVerify(response: any, deviceName?: string) {
    return this.post<any>('/auth/passkeys/register/verify', { response, deviceName });
  }

  passkeyLoginOptions(userId?: string) {
    return this.post<any>('/auth/passkeys/login/options', { userId });
  }

  passkeyLoginVerify(response: any) {
    return this.post<{ user: any }>('/auth/passkeys/login/verify', { response });
  }

  getPasskeys() {
    return this.get<any[]>('/auth/passkeys');
  }

  deletePasskey(id: string) {
    return this.delete<any>(`/auth/passkeys/${id}`);
  }

  // Products
  getProducts(params?: string) {
    return this.get<{ products: any[]; total: number }>(`/products${params ? `?${params}` : ''}`);
  }

  getProductBySlug(slug: string) {
    return this.get<any>(`/products/${slug}`);
  }

  getFeaturedProducts() {
    return this.get<any[]>('/products/featured');
  }

  // Categories
  getCategories() {
    return this.get<any[]>('/categories');
  }

  getActiveCategories() {
    return this.get<any[]>('/categories/active');
  }

  getCategoryBySlug(slug: string) {
    return this.get<any>(`/categories/${slug}`);
  }

  // Cart
  getCart() {
    return this.get<any>('/cart');
  }

  addToCart(productId: string, quantity: number, notes?: string) {
    return this.post<any>('/cart/items', { productId, quantity, notes });
  }

  updateCartItem(itemId: string, quantity: number, notes?: string) {
    return this.put<any>(`/cart/items/${itemId}`, { quantity, notes });
  }

  removeFromCart(itemId: string) {
    return this.delete<any>(`/cart/items/${itemId}`);
  }

  clearCart() {
    return this.delete<any>('/cart');
  }

  applyCoupon(code: string) {
    return this.post<any>(`/cart/coupon/${code}`);
  }

  removeCoupon() {
    return this.delete<any>('/cart/coupon');
  }

  // Orders
  createOrder(data: any) {
    return this.post<any>('/orders', data);
  }

  getMyOrders(params?: string) {
    return this.get<any>(`/orders/my${params ? `?${params}` : ''}`);
  }

  getMyOrder(id: string) {
    return this.get<any>(`/orders/my/${id}`);
  }

  cancelOrder(id: string) {
    return this.post<any>(`/orders/${id}/cancel`);
  }

  // Payments
  getPublicKey() {
    return this.get<{ publicKey: string }>('/payments/public-key');
  }

  createPixPayment(orderId: string) {
    return this.post<any>(`/payments/pix/${orderId}`);
  }

  createCardPayment(orderId: string, cardData: any) {
    return this.post<any>(`/payments/card/${orderId}`, cardData);
  }

  // Addresses
  getAddresses() {
    return this.get<any[]>('/users/me/addresses');
  }

  createAddress(data: any) {
    return this.post<any>('/users/me/addresses', data);
  }

  updateAddress(addressId: string, data: any) {
    return this.put<any>(`/users/me/addresses/${addressId}`, data);
  }

  deleteAddress(addressId: string) {
    return this.delete<any>(`/users/me/addresses/${addressId}`);
  }

  // Admin
  getDashboard() {
    return this.get<any>('/admin/dashboard');
  }

  getAdminOrders(params?: string) {
    return this.get<any>(`/admin/orders${params ? `?${params}` : ''}`);
  }

  getAdminOrder(id: string) {
    return this.get<any>(`/admin/orders/${id}`);
  }

  updateOrderStatus(id: string, status: string) {
    return this.patch<any>(`/admin/orders/${id}/status`, { status });
  }

  getAdminUsers(params?: string) {
    return this.get<any>(`/admin/users${params ? `?${params}` : ''}`);
  }

  updateUserRole(id: string, role: string) {
    return this.patch<any>(`/admin/users/${id}/role`, { role });
  }

  toggleUserStatus(id: string) {
    return this.patch<any>(`/admin/users/${id}/status`);
  }

  getAdminProducts(params?: string) {
    return this.get<any>(`/admin/products${params ? `?${params}` : ''}`);
  }

  createProduct(data: any) {
    return this.post<any>('/admin/products', data);
  }

  updateProduct(id: string, data: any) {
    return this.put<any>(`/admin/products/${id}`, data);
  }

  deleteProduct(id: string) {
    return this.delete<any>(`/admin/products/${id}`);
  }

  getAdminCategories() {
    return this.get<any[]>('/admin/categories');
  }

  createCategory(data: any) {
    return this.post<any>('/admin/categories', data);
  }

  updateCategory(id: string, data: any) {
    return this.put<any>(`/admin/categories/${id}`, data);
  }

  deleteCategory(id: string) {
    return this.delete<any>(`/admin/categories/${id}`);
  }

  getCoupons() {
    return this.get<any[]>('/admin/coupons');
  }

  createCoupon(data: any) {
    return this.post<any>('/admin/coupons', data);
  }

  updateCoupon(id: string, data: any) {
    return this.put<any>(`/admin/coupons/${id}`, data);
  }

  deleteCoupon(id: string) {
    return this.delete<any>(`/admin/coupons/${id}`);
  }

  getReports(params?: string) {
    return this.get<any>(`/admin/reports${params ? `?${params}` : ''}`);
  }

  // Partners
  partnerRegister(data: { email: string; password: string; name?: string; phone?: string; storeName: string; storeDescription?: string; cnpj?: string }) {
    return this.post<{ user: any }>('/auth/register', { ...data, isPartner: true });
  }

  getPartnerProfile() {
    return this.get<any>('/partner/profile');
  }

  updatePartnerProfile(data: any) {
    return this.put<any>('/partner/profile', data);
  }

  getPartnerDashboard() {
    return this.get<any>('/partner/dashboard');
  }

  getPartnerProducts(params?: string) {
    return this.get<any>(`/partner/products${params ? `?${params}` : ''}`);
  }

  createPartnerProduct(data: any) {
    return this.post<any>('/partner/products', data);
  }

  updatePartnerProduct(id: string, data: any) {
    return this.put<any>(`/partner/products/${id}`, data);
  }

  deletePartnerProduct(id: string) {
    return this.delete<any>(`/partner/products/${id}`);
  }

  getPartnerOrders(params?: string) {
    return this.get<any>(`/partner/orders${params ? `?${params}` : ''}`);
  }

  getPartnerMpAuthUrl() {
    return this.get<{ url: string }>('/partner/mp/auth-url');
  }

  linkPartnerMpAccount(code: string) {
    return this.post<any>('/partner/mp/link', { code });
  }

  getPartnerMpStatus() {
    return this.get<{ linked: boolean }>('/partner/mp/status');
  }

  getPartnerEarnings(params?: string) {
    return this.get<any>(`/partner/earnings${params ? `?${params}` : ''}`);
  }

  getAdminPartners(params?: string) {
    return this.get<any>(`/admin/partners${params ? `?${params}` : ''}`);
  }

  approvePartner(id: string) {
    return this.patch<any>(`/admin/partners/${id}/approve`);
  }

  rejectPartner(id: string) {
    return this.patch<any>(`/admin/partners/${id}/reject`);
  }

  // Uploads
  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const response = await fetch(`${API_URL}/uploads`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }
    return response.json() as Promise<{ url: string; filename: string }>;
  }

  listGallery() {
    return this.get<{ url: string; filename: string }[]>('/uploads');
  }
}

export const api = new ApiClient();
