import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requirePermission('aiTrainingAccess');
    const datasets = await prisma.aiTrainingDataset.findMany({
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploadedBy: {
          select: { name: true }
        }
      }
    });
    return NextResponse.json({ datasets });
  } catch (error) {
    return handleApiError(error);
  }
}

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const session = await requirePermission('aiTrainingAccess');
    const contentType = req.headers.get('content-type') || '';
    
    let name: string;
    let dataUrl: string;
    let sourceType: string = 'URL';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      name = formData.get('name') as string;
      const file = formData.get('file') as File;

      if (!name || !file) {
        return NextResponse.json({ error: 'Name and CSV file are required' }, { status: 400 });
      }

      if (!file.name.endsWith('.csv')) {
        return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });
      }

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'datasets');
      await mkdir(uploadDir, { recursive: true });
      
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      
      dataUrl = `/uploads/datasets/${fileName}`;
      sourceType = 'FILE';
    } else {
      const body = await req.json();
      name = body.name;
      dataUrl = body.dataUrl;

      if (!name || !dataUrl) {
        return NextResponse.json({ error: 'Name and Data URL are required' }, { status: 400 });
      }
    }

    const dataset = await prisma.aiTrainingDataset.create({
      data: {
        name,
        dataUrl,
        sourceType,
        uploadedById: session.userId
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_TRAINING_DATASET_UPLOAD',
        details: `Uploaded ${sourceType} dataset: ${name} (${dataUrl})`
      }
    });

    return NextResponse.json({ dataset });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requirePermission('aiTrainingAccess');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.aiTrainingDataset.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_TRAINING_DATASET_DELETE',
        details: `Deleted dataset ID: ${id}`
      }
    });

    return NextResponse.json({ message: 'Dataset deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
