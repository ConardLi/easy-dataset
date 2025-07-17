import { NextResponse } from 'next/server';
import { updateModelConfig, deleteModelConfigById } from '@/lib/db/model-config';
import logger from '@/lib/util/logger';

// PUT update a model
export async function PUT(request, { params }) {
  try {
    const { modelId } = params;
    const body = await request.json();
    const updatedModel = await updateModelConfig(modelId, body);
    return NextResponse.json({ code: 0, data: updatedModel });
  } catch (error) {
    logger.error(`Failed to update model ${params.modelId}:`, error);
    return NextResponse.json({ code: 500, error: `Failed to update model ${params.modelId}` }, { status: 500 });
  }
}

// DELETE a model
export async function DELETE(request, { params }) {
  try {
    const { modelId } = params;
    await deleteModelConfigById(modelId);
    return NextResponse.json({ code: 0, message: 'Model deleted successfully' });
  } catch (error) {
    logger.error(`Failed to delete model ${params.modelId}:`, error);
    return NextResponse.json({ code: 500, error: `Failed to delete model ${params.modelId}` }, { status: 500 });
  }
}
