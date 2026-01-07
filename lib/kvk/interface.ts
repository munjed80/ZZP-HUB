// KVK API Interface
export interface KVKSearchResult {
  kvkNumber: string;
  name: string;
  city: string;
  address: string;
}

export interface KVKDetails {
  kvkNumber: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  btwNumber?: string;
}

export interface KVKProvider {
  search(query: string): Promise<KVKSearchResult[]>;
  getDetails(kvkNumber: string): Promise<KVKDetails | null>;
}
