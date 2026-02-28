export interface Product {
  id: string;
  name: string;
  images?: string[];
  image?: string;
  price: number;
  originalPrice?: number;
  brand?: string;
}

export type ProductDetails = {
  id: string;
  name: string;
  categoryName: string;
  images: string[];
  price: number;
  originalPrice: number;
  description: string;
  youtubeUrl?: string | null;
};
