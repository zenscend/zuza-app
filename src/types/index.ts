export type UserRole = 'vendor' | 'field_agent' | 'admin' | 'super_admin'
export type BillingStatus = 'free' | 'active' | 'past_due' | 'cancelled'
export type VendorStatus = 'pending' | 'active' | 'inactive' | 'rejected'
export type BusinessType = 'kota_outlet' | 'chisanyama' | 'street_food' | 'spaza_shop' | 'other'
export type PrimaryProduct = 'cooking_oil' | 'potatoes'

export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
] as const

export const POS_PROVIDERS = [
  'Yoco',
  'iKhokha',
  'VodaPay',
  'Capitec',
  'Other',
] as const

export interface ProductLine {
  name: string
  monthly_spend?: number
}

export const PAYMENT_METHODS = [
  { value: 'card_machine',  label: 'Card Machine' },
  { value: 'cash',          label: 'Cash' },
  { value: 'eft',           label: 'EFT / Instant EFT' },
  { value: 'online_gateway', label: 'Online Payment Gateway' },
] as const

export const ORDER_VOLUMES = [
  { value: 'under_100',    label: 'Under 100 orders/month' },
  { value: '100_500',      label: '100 – 500 orders/month' },
  { value: '500_2000',     label: '500 – 2 000 orders/month' },
  { value: '2000_plus',    label: '2 000+ orders/month' },
] as const

export const STOCK_ORDER_METHODS = [
  { value: 'cash_and_carry',      label: 'Walk-in Cash & Carry' },
  { value: 'wholesaler_delivery', label: 'Local Wholesaler Delivery' },
  { value: 'bakkie_trader',       label: 'Independent Bakkie Traders' },
  { value: 'other',               label: 'Other' },
] as const

export const CONTACT_PREFERENCES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email',    label: 'Email' },
  { value: 'call',     label: 'Phone Call' },
] as const

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone_number: string | null
  role: UserRole
  billing_status: BillingStatus
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  created_at: string
  updated_at: string
  business_name: string
  business_type: BusinessType
  owner_name: string
  phone_number: string
  email: string | null
  street_address: string | null
  suburb: string | null
  city: string
  province: string | null
  trading_spot: string | null
  coordinates: string | null
  primary_products: PrimaryProduct[]
  additional_products: string | null
  product_lines: ProductLine[]
  estimated_monthly_spend: number | null
  has_pos: boolean | null
  pos_provider: string | null
  payment_methods: string[]
  monthly_order_volume: string | null
  stock_order_method: string | null
  preferred_contact: string[]
  status: VendorStatus
  onboarded_by: string | null
  notes: string | null
  wallet_balance: number
}

export interface CreateVendorInput {
  business_name: string
  business_type: BusinessType
  owner_name: string
  phone_number: string
  email?: string
  street_address?: string
  suburb?: string
  city: string
  province?: string
  trading_spot?: string
  coordinates?: string        // PostgreSQL point as "(lng,lat)"
  primary_products: PrimaryProduct[]
  product_lines?: ProductLine[]
  additional_products?: string
  estimated_monthly_spend?: number
  has_pos?: boolean
  pos_provider?: string
  payment_methods?: string[]
  monthly_order_volume?: string
  stock_order_method?: string
  preferred_contact?: string[]
  notes?: string
  onboarded_by?: string
}
