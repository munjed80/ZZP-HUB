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
    const kvkNumber = searchParams.get('kvk');

    if (!kvkNumber) {
      return NextResponse.json(
        { error: 'KVK number is required' },
        { status: 400 }
      );
    }

    const provider = getKVKProvider();
    const details = await provider.getDetails(kvkNumber);

    if (!details) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ details });
  } catch (error) {
    console.error('KVK details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KVK details' },
      { status: 500 }
    );
  }
}
