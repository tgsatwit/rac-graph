import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddings } from 'database';
import { queryVector } from 'ai-service';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');

  if (!query) {
    return NextResponse.json({ error: 'Missing q param' }, { status: 400 });
  }

  try {
    const [embedding] = await getEmbeddings([query]);
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (tag) filter.tags = { $contains: tag };

    const matches = await queryVector('kb', embedding, 10, Object.keys(filter).length ? filter : undefined);
    return NextResponse.json(matches);
  } catch (err) {
    console.error('search error', err);
    return NextResponse.json({ error: 'search failed' }, { status: 500 });
  }
} 