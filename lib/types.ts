export type VariantOption = {
  name: string;
  price: number;
  compare_price?: number;
  default?: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description_html: string | null;
  ingredients_html: string | null;
  how_to_use_html: string | null;
  faqs: { question: string; answer: string }[];
  price: number;
  compare_price: number | null;
  images: string[];
  stock: number;
  sku: string | null;
  trust_badges: { icon: string; text: string }[];
  meta_title: string | null;
  meta_description: string | null;
  active: boolean;
  variants: {
    enabled: boolean;
    label: string;
    options: VariantOption[];
  };
  created_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  variant: string | null;
  customer_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string | null;
  pincode: string | null;
  state: string | null;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  verification_status: "unverified" | "verified";
  tracking_number: string | null;
  created_at: string;
};

export type PageRow = {
  id: string;
  title: string;
  slug: string;
  content_html: string | null;
  show_in_header: boolean;
  show_in_footer: boolean;
  created_at: string;
};

export type FormField = {
  id: string;
  field_name: string;
  label: string;
  placeholder: string | null;
  required: boolean;
  visible: boolean;
  field_type: "text" | "numeric" | "dropdown";
  min_chars: number;
  sort_order: number;
};

export type Pixel = {
  id: string;
  label: string | null;
  pixel_id: string;
  ad_account_id: string | null;
  active: boolean;
  events: {
    pageView: boolean;
    viewContent: boolean;
    addToCart: boolean;
    initiateCheckout: boolean;
    purchase: boolean;
  };
  test_mode: boolean;
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

export const STATE_CODES: Record<string, string> = {
  "Andhra Pradesh": "AP", "Arunachal Pradesh": "AR", "Assam": "AS", "Bihar": "BR",
  "Chhattisgarh": "CG", "Goa": "GA", "Gujarat": "GJ", "Haryana": "HR",
  "Himachal Pradesh": "HP", "Jharkhand": "JH", "Karnataka": "KA", "Kerala": "KL",
  "Madhya Pradesh": "MP", "Maharashtra": "MH", "Manipur": "MN", "Meghalaya": "ML",
  "Mizoram": "MZ", "Nagaland": "NL", "Odisha": "OD", "Punjab": "PB",
  "Rajasthan": "RJ", "Sikkim": "SK", "Tamil Nadu": "TN", "Telangana": "TS",
  "Tripura": "TR", "Uttar Pradesh": "UP", "Uttarakhand": "UK", "West Bengal": "WB",
  "Andaman and Nicobar Islands": "AN", "Chandigarh": "CH",
  "Dadra and Nagar Haveli and Daman and Diu": "DD", "Delhi": "DL",
  "Jammu and Kashmir": "JK", "Ladakh": "LA", "Lakshadweep": "LD", "Puducherry": "PY",
};
