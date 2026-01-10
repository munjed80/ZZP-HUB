import type { KVKProvider, KVKSearchResult, KVKDetails } from './interface';

/**
 * Mock KVK provider with static data
 * This is used when no real KVK API key is available
 */
export class MockKVKProvider implements KVKProvider {
  private mockData: KVKDetails[] = [
    {
      kvkNumber: '12345678',
      name: 'Test BV',
      address: 'Teststraat 1',
      postalCode: '1234 AB',
      city: 'Amsterdam',
      btwNumber: 'NL123456789B01',
    },
    {
      kvkNumber: '87654321',
      name: 'Demo Consultancy',
      address: 'Demoweg 42',
      postalCode: '5678 CD',
      city: 'Rotterdam',
      btwNumber: 'NL987654321B02',
    },
    {
      kvkNumber: '11223344',
      name: 'Voorbeeld Diensten',
      address: 'Voorbeeldlaan 99',
      postalCode: '3456 EF',
      city: 'Utrecht',
      btwNumber: 'NL112233445B03',
    },
    {
      kvkNumber: '99887766',
      name: 'Sample Solutions',
      address: 'Samplelaan 10',
      postalCode: '2345 GH',
      city: 'Den Haag',
      btwNumber: 'NL998877665B04',
    },
  ];

  async search(query: string): Promise<KVKSearchResult[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const lowerQuery = query.toLowerCase();
    
    return this.mockData
      .filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.city.toLowerCase().includes(lowerQuery) ||
        item.kvkNumber.includes(query)
      )
      .map(item => ({
        kvkNumber: item.kvkNumber,
        name: item.name,
        city: item.city,
        address: item.address,
        postalCode: item.postalCode,
      }))
      .slice(0, 5); // Return max 5 results
  }

  async getDetails(kvkNumber: string): Promise<KVKDetails | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const result = this.mockData.find(item => item.kvkNumber === kvkNumber);
    return result || null;
  }
}
