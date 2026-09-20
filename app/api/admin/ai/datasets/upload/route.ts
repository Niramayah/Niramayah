import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    const session = await requirePermission('aiManage');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const uploadMethod = formData.get('uploadMethod') as string;
    const dataUrl = formData.get('dataUrl') as string;
    const file = formData.get('file') as File | null;

    if (!name) {
      return NextResponse.json({ error: 'Dataset name is required' }, { status: 400 });
    }

    let finalDataUrl = dataUrl;

    if (uploadMethod === 'CSV') {
      if (!file) {
        return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
      }

      if (!file.name.endsWith('.csv')) {
        return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });
      }

      // Safe file size limit (e.g., 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = join(process.cwd(), 'public', 'uploads', 'datasets');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const path = join(uploadDir, fileName);
      await writeFile(path, buffer);

      finalDataUrl = `/uploads/datasets/${fileName}`;
    }

    if (!finalDataUrl) {
      return NextResponse.json({ error: 'Data URL or file is required' }, { status: 400 });
    }

    const dataset = await prisma.aiTrainingDataset.create({
      data: {
        name,
        dataUrl: finalDataUrl
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_DATASET_UPLOAD',
        details: `Uploaded dataset: ${name} (${uploadMethod})`
      }
    });

    return NextResponse.json({ dataset }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}
