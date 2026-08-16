export interface Product {
  searchText: string;
  qty: number;
  id: string;
  name: string;
  images?: string[];
  image?: string;
  price: number;
  originalPrice?: number;
  brandId?: string;
  discountText?: string;
  categoryId?: string;
  sequenceNumber?: number;
  isComboPackage?: boolean;
  productFamily?: string;
  cartonQty?: number;
  bulkOrderBasePrice?: number;
  isBulkOrderOnly?: boolean;
  isRetailOnly?: boolean;
  packQuantity?: number;
  packUnit?: string;
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
  packQuantity?: number;
  packUnit?: string;
  brandId?: string;
  categoryId?: string;
};
