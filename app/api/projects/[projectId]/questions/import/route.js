import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getOrCreateImportedChunk, getChunkByName, saveChunks } from '@/lib/db/chunks';
import { saveQuestions, isExistByQuestion } from '@/lib/db/questions';

export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const { questions, chunkStrategy = 'virtual', sourceInfo } = await request.json();

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid questions data' }, { status: 400 });
    }

    let defaultChunk = null;
    if (chunkStrategy === 'virtual' || chunkStrategy === 'match') {
      defaultChunk = await getOrCreateImportedChunk(projectId);
    }

    const errors = [];
    let successCount = 0;
    let skippedCount = 0;
    let duplicateCount = 0;

    const BATCH_SIZE = 200;
    const questionsToSave = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const item = questions[i];
        const questionText = typeof item.question === 'string' ? item.question.trim() : '';

        if (!questionText) {
          errors.push(`Record ${i + 1}: missing required field (question), skipped`);
          skippedCount++;
          continue;
        }

        const isDuplicate = await isExistByQuestion(questionText, projectId);
        if (isDuplicate) {
          duplicateCount++;
          continue;
        }

        let chunkId = defaultChunk?.id;

        if (chunkStrategy === 'match' && item.chunkName) {
          const matched = await getChunkByName(projectId, item.chunkName.trim());
          if (matched) {
            chunkId = matched.id;
          }
        } else if (chunkStrategy === 'create' && item.context) {
          const chunkName = item.chunkName || `imported-${nanoid(6)}`;
          const existingChunk = await getChunkByName(projectId, chunkName);
          if (existingChunk) {
            chunkId = existingChunk.id;
          } else {
            const newChunkData = {
              name: chunkName,
              projectId,
              fileId: 'imported',
              fileName: 'imported.md',
              content: item.context.trim(),
              summary: `Imported chunk: ${chunkName}`,
              size: item.context.trim().length
            };
            await saveChunks([newChunkData]);
            const created = await getChunkByName(projectId, chunkName);
            chunkId = created?.id;
          }
        }

        if (!chunkId) {
          if (!defaultChunk) {
            defaultChunk = await getOrCreateImportedChunk(projectId);
          }
          chunkId = defaultChunk.id;
        }

        const label = typeof item.label === 'string' ? item.label.trim() : '';

        questionsToSave.push({
          projectId,
          chunkId,
          question: questionText,
          label: label || 'other'
        });

        if (questionsToSave.length >= BATCH_SIZE) {
          await saveQuestions(projectId, questionsToSave);
          successCount += questionsToSave.length;
          questionsToSave.length = 0;
        }
      } catch (error) {
        errors.push(`Record ${i + 1}: ${error.message}`);
      }
    }

    if (questionsToSave.length > 0) {
      await saveQuestions(projectId, questionsToSave);
      successCount += questionsToSave.length;
    }

    return NextResponse.json({
      success: successCount,
      total: questions.length,
      failed: errors.length,
      skipped: skippedCount,
      duplicates: duplicateCount,
      errors,
      sourceInfo
    });
  } catch (error) {
    console.error('Import questions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
