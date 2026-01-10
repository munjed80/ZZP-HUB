import type { KVKDetails, KVKProvider, KVKSearchResult } from './interface';

const SEARCH_URL = 'https://api.kvk.nl/api/v2/search/companies';

const toRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;

const pickString = (...values: unknown[]): string | undefined =>
  values.find((value): value is string => typeof value === 'string');

export class RealKVKProvider implements KVKProvider {
  constructor(private apiKey: string) {}

  private getHeaders() {
    return {
      apikey: this.apiKey,
      Accept: 'application/json',
    };
  }

  private mapResult(item: unknown): KVKSearchResult | null {
    const record = toRecord(item);
    if (!record) return null;

    const addressSource =
      record['addresses'] ??
      record['adressen'] ??
      toRecord(record['results'])?.['addresses'] ??
      record['visitingAddress'] ??
      record['bezoekadres'];

    const addressEntry = Array.isArray(addressSource)
      ? addressSource.find(Boolean)
      : addressSource;
    const address = toRecord(addressEntry);

    const street = pickString(
      address?.['street'],
      address?.['straatnaam'],
      address?.['straat'],
      address?.['streetname']
    );
    const houseNumber = pickString(
      address?.['houseNumber'],
      address?.['huisnummer'],
      address?.['number']
    );
    const postalCode = pickString(address?.['postalCode'], address?.['postcode']);
    const city = pickString(address?.['city'], address?.['plaats'], address?.['town']) || '';

    const tradeNames =
      toRecord(record['tradeNames']) ||
      toRecord(record['handelsnamen']) ||
      toRecord(toRecord(record['profile'])?.['tradeNames']) ||
      {};
    const name =
      pickString(
        tradeNames['businessName'],
        tradeNames['companyName'],
        tradeNames['shortBusinessName']
      ) ||
      pickString(record['handelsnaam'], record['tradeName'], record['name']);

    const kvkNumber =
      pickString(
        record['kvkNumber'],
        record['kvkNummer'],
        record['kvk'],
        record['dossiernummer']
      ) ||
      '';

    if (!kvkNumber || !name) {
      return null;
    }

    const addressLine = [street, houseNumber].filter(Boolean).join(' ').trim();

    return {
      kvkNumber,
      name,
      city,
      address: addressLine || postalCode || '',
      postalCode: postalCode || undefined,
    };
  }

  async search(query: string): Promise<KVKSearchResult[]> {
    const params = new URLSearchParams({
      startPage: '1',
      pageSize: '5',
    });

    const numericQuery = query.replace(/\D/g, '');
    if (numericQuery.length >= 4) {
      params.set('kvkNumber', numericQuery);
    } else {
      params.set('tradeName', query);
    }

    const url = `${SEARCH_URL}?${params.toString()}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      console.error(
        'KVK API search failed',
        response.status,
        await response.text().catch(() => '')
      );
      return [];
    }

    const data = await response.json().catch(() => ({}));
    const items =
      data?.items ||
      data?.data?.items ||
      data?.data ||
      data?.resultaten ||
      data?.results ||
      [];

    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => this.mapResult(item))
      .filter((item): item is KVKSearchResult => Boolean(item));
  }

  async getDetails(kvkNumber: string): Promise<KVKDetails | null> {
    const results = await this.search(kvkNumber);
    const match = results.find((item) => item.kvkNumber === kvkNumber) || results[0];

    if (!match) return null;

    return {
      kvkNumber: match.kvkNumber,
      name: match.name,
      address: match.address,
      city: match.city,
      postalCode: match.postalCode || '',
      btwNumber: '',
    };
  }
}
