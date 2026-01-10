export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}
