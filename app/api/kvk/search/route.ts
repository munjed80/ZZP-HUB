import { NextRequest, NextResponse } from 'next/server';
import { getKVKProvider } from '@/lib/kvk';
import { getServerAuthSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') ?? searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const provider = getKVKProvider();
    const results = await provider.search(query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('KVK search error:', error);
    return NextResponse.json(
      { error: 'Failed to search KVK' },
      { status: 500 }
    );
  }
}
