export interface Product {
  qty: number;
  id: string;
  name: string;
  images?: string[];
  image?: string;
  price: number;
  originalPrice?: number;
  brand?: string;
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
};
