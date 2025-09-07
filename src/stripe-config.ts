export interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
}

export const products: Product[] = [
  {
    id: 'prod_T0ZeGPg9sGf62g',
    priceId: 'price_1S4YVA3JSVwuXsDHpfhcE4cw',
    name: 'Yearly',
    description: 'Pay for the whole year',
    mode: 'subscription'
  },
  {
    id: 'prod_T0ZdOeOZqbZQJF',
    priceId: 'price_1S4YUa3JSVwuXsDHF4yKU7KJ',
    name: 'Monthly Subscription',
    description: 'Pay Monthly',
    mode: 'subscription'
  }
];

export const getProductByPriceId = (priceId: string): Product | undefined => {
  return products.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};