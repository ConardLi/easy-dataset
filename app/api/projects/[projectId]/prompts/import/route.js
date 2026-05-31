import { NextResponse } from 'next/server';
import { saveCustomPrompt, clearAllCustomPrompts } from '@/lib/db/custom-prompts';

export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { prompts, mode = 'merge' } = body;

    if (!prompts || !Array.isArray(prompts)) {
      return NextResponse.json({ error: 'prompts array is required' }, { status: 400 });
    }

    if (mode === 'replace') {
      await clearAllCustomPrompts(projectId);
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const prompt of prompts) {
      if (!prompt.isCustomized) {
        skipped++;
        continue;
      }

      const { promptType, promptKey, language, content } = prompt;
      if (!promptType || !promptKey || !language || content === undefined) {
        errors.push({ promptKey, reason: 'Missing required fields' });
        skipped++;
        continue;
      }

      try {
        await saveCustomPrompt(projectId, promptType, promptKey, language, content);
        imported++;
      } catch (err) {
        errors.push({ promptKey, reason: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      mode
    });
  } catch (error) {
    console.error('Import prompts failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
