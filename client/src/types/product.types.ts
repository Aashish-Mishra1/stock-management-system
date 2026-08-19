export type IProduct = {
  id: number
  name: string
  description?: string
  category_id: number
  category_name?: string
  brand_id?: number
  brand_name?: string
  base_price: number
  cost_price?: number
  image_url?: string
  status: string
  user_id: number
  variants?: IVariant[]
}

export interface IVariant {
  id: number
  product_id: number
  variant_name: string
  sku?: string
  price: number
  quantity_in_stock: number
  attributes?: Record<string, any>
}

export interface ISeller {
  id: number
  name: string
  email: string
  phone: string
  address?: string
}

export interface ICategory {
  id: number
  name: string
}

export interface IBrand {
  id: number
  name: string
}