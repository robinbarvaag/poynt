export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  /** Valgfri miniatyr-url (Payload `featuredImage`) — vises i handlekurven. */
  image?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}
