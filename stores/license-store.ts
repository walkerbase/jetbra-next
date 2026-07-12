import { atom, computed } from 'nanostores';

export type LicenseProfile = {
  licenseeName: string;
  assigneeName: string;
  assigneeEmail: string;
  expiryDate: string;
};
export interface Product {
  id?: number;
  name: string;
  code: string;
  description: string;
  icon: string;
}

export const $profile = atom<LicenseProfile>({
  licenseeName: 'Nsg',
  assigneeName: 'Nsg',
  assigneeEmail: 'Nsg@vvy.net',
  expiryDate: '2029-01-01',
});
export const $products = atom<Product[]>([]);
export const $selectedCodes = atom<string[]>([]);
export const $query = atom('');
export const $loading = atom(true);

export const $filteredProducts = computed(
  [$products, $query],
  (products, query) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((item) =>
      `${item.name} ${item.description} ${item.code}`
        .toLowerCase()
        .includes(keyword),
    );
  },
);

export function toggleProduct(product: Product, checked: boolean) {
  const current = new Set($selectedCodes.get());
  checked ? current.add(product.code) : current.delete(product.code);
  $selectedCodes.set([...current]);
}
