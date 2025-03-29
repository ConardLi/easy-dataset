import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getProjectRoot } from '@/lib/db/base';

export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json({ error: 'The project ID cannot be empty' }, { status: 400 });
    }

    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, projectId);
    const configPath = path.join(projectPath, 'dataset_info.json');

    const exists = fs.existsSync(configPath);

    return NextResponse.json({
      exists,
      configPath: exists ? configPath : null
    });
  } catch (error) {
    console.error('Error checking Llama Factory config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
