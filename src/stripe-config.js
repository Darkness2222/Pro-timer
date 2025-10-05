export const products = [
  {
    id: 'prod_pro',
    priceId: 'price_pro_monthly',
    name: 'Pro',
    description: 'Up to 5 users',
    price: 14.99,
    maxUsers: 5,
    mode: 'subscription',
    planType: 'pro'
  },
  {
    id: 'prod_enterprise',
    priceId: 'price_enterprise_monthly',
    name: 'Enterprise',
    description: 'Unlimited users',
    price: 19.99,
    maxUsers: -1,
    mode: 'subscription',
    planType: 'enterprise'
  }
];

export const getProductByPriceId = (priceId) => {
  return products.find(product => product.priceId === priceId);
};

export const getProductById = (id) => {
  return products.find(product => product.id === id);
};