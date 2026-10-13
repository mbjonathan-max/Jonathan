export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  is_admin: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  brand: string;
  reference: string;
  specs: string;
  category_id: string | null;
  created_at: string;
  category?: Category;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  payment_method: string;
  delivery_address: string;
  created_at: string;
  order_items?: OrderItem[];
  profiles?: Profile;
}

export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  products?: Product;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  created_at: string;
  orders?: Order;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  paid: 'Payée',
  preparing: 'Préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  paid: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Carte bancaire' },
  { id: 'mobile_money', label: 'Mobile Money' },
  { id: 'cash_on_delivery', label: 'Paiement à la livraison' },
  { id: 'bank_transfer', label: 'Virement bancaire' },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Carte bancaire',
  mobile_money: 'Mobile Money',
  cash_on_delivery: 'Paiement à la livraison',
  bank_transfer: 'Virement bancaire',
};

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
