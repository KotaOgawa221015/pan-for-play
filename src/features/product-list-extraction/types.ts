export type ExtractedProduct = {
  name: string;
  count: number;
};

export type ProductListExtractionInput = {
  fileName: string;
};

export type ExtractProducts = (
  input: ProductListExtractionInput,
) => Promise<ExtractedProduct[]>;
