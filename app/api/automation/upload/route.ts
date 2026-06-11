import { NextResponse } from 'next/server';
import { getTeamForUser } from '@/lib/db/queries';
import { checkRoutePermission } from '@/lib/auth/permissions-guard';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// Allowed file types for automation uploads
const ALLOWED_MIME_TYPES = [
  'application/json',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts and special characters
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export async function POST(request: Request) {
  try {
    const { error } = await checkRoutePermission('automation');
    if (error) return error;

    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Sanitize filename
    const originalName = sanitizeFilename(file.name);
    const extension = originalName.split('.').pop() || 'dat';
    const uniqueId = uuidv4();
    const filename = `${uniqueId}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Additional validation: check file signature for common types
    if (file.type === 'application/json') {
      try {
        JSON.parse(buffer.toString('utf-8'));
      } catch {
        return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
      }
    }

    const relativeDirPath = path.join('uploads', 'automation');
    const absoluteDirPath = path.join(process.cwd(), 'public', relativeDirPath);
    const absoluteFilePath = path.join(absoluteDirPath, filename);

    await fs.mkdir(absoluteDirPath, { recursive: true });
    await fs.writeFile(absoluteFilePath, buffer);

    const publicUrl = `/${relativeDirPath}/${filename}`;

    return NextResponse.json({
      url: publicUrl,
      filename: originalName,
      mimetype: file.type,
      size: file.size,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}