export interface ITableSale {
  id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  payment_method: string;
  sale_date: string;
  total_items: number;
  items?: ISaleItem[];
}

export interface ISaleItem {
  id: number;
  product_variant_id: number;
  variant_name: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}