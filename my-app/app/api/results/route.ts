import { NextRequest, NextResponse } from 'next/server';
import { getAllResults, createResult } from '@/lib/firestore';
import { verifyAdminSession } from '@/lib/auth';
import type { CreateResultInput } from '@/types';

// GET all results (public)
export async function GET() {
  try {
    const results = await getAllResults();
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}

// POST create new result (admin only)
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateResultInput = await request.json();

    if (!body.title || !body.results || !Array.isArray(body.results)) {
      return NextResponse.json(
        { error: 'Title and results array are required' },
        { status: 400 }
      );
    }

    if (body.results.length === 0) {
      return NextResponse.json({ error: 'Results array cannot be empty' }, { status: 400 });
    }

    const id = await createResult(body);
    return NextResponse.json({ id, message: 'Result created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating result:', error);
    return NextResponse.json({ error: 'Failed to create result' }, { status: 500 });
  }
}
