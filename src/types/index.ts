export type Item = {
  id: number;
  name: string;
  price: number; // 決済に必要
  count: number;
};

export type CartState = {
  breads: Item[];
  soups: Item[];
};
