export interface Product {
  searchText: string;
  qty: number;
  id: string;
  name: string;
  images?: string[];
  image?: string;
  price: number;
  originalPrice?: number;
  brand?: string;
  discountText?: string;
  categoryId?: string;
  isComboPackage?: boolean;
  productFamily?: string;
}

export type ProductDetails = {
  qty: number;
  id: string;
  name: string;
  categoryName: string;
  images: string[];
  price: number;
  originalPrice: number;
  description: string;
  youtubeUrl?: string | null;
  discountText?: string;
  isComboPackage?: boolean;
};
