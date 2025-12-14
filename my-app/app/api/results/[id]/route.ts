import { NextRequest, NextResponse } from 'next/server';
import { getResultById, updateResult, deleteResult } from '@/lib/firestore';
import { verifyAdminSession } from '@/lib/auth';
import type { UpdateResultInput } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single result (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await getResultById(id);

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 });
  }
}

// PUT update result (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateResultInput = await request.json();

    const existingResult = await getResultById(id);
    if (!existingResult) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    await updateResult(id, body);
    return NextResponse.json({ message: 'Result updated successfully' });
  } catch (error) {
    console.error('Error updating result:', error);
    return NextResponse.json({ error: 'Failed to update result' }, { status: 500 });
  }
}

// DELETE result (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingResult = await getResultById(id);
    if (!existingResult) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    await deleteResult(id);
    return NextResponse.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    return NextResponse.json({ error: 'Failed to delete result' }, { status: 500 });
  }
}
