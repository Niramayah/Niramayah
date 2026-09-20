import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const history = await prisma.aiTest.findMany({
      where: { 
        userId: session.userId,
        isSaved: true,
        testSource: null // Only show real assessments in history
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// This now only UPDATES a record to "saved" state
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assessmentId } = await req.json();

    if (!assessmentId) {
      return NextResponse.json({ error: 'Missing assessment ID' }, { status: 400 });
    }

    const testRecord = await prisma.aiTest.findUnique({
      where: { id: assessmentId }
    });

    if (!testRecord || testRecord.userId !== session.userId) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const updatedTest = await prisma.aiTest.update({
      where: { id: assessmentId },
      data: { isSaved: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: testRecord.testSource ? 'ADMIN_DIAGNOSIS_TEST_SAVED' : 'DIAGNOSIS_SAVED',
        details: testRecord.testSource 
          ? `Admin saved test diagnosis report ${assessmentId}. Source: ${testRecord.testSource}`
          : `User saved diagnosis report ${assessmentId}`
      }
    });

    return NextResponse.json({
      message: 'Assessment saved to history',
      test: updatedTest
    });

  } catch (error) {
    console.error('History API POST error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save assessment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
