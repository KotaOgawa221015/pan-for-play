import type { ExtractProducts } from './types';
import mockResult from './mock-result.json';

export const extractProductsFromMock: ExtractProducts = async () =>
  mockResult.products.map((product) => ({
    name: product.name,
    count: product.count,
  }));
