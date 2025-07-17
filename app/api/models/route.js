import { NextResponse } from 'next/server';
import { getAllModelConfigs, createModelConfig } from '@/lib/db/model-config';
import logger from '@/lib/util/logger';

// GET all models
export async function GET() {
  try {
    const models = await getAllModelConfigs();
    return NextResponse.json({ code: 0, data: models });
  } catch (error) {
    logger.error('Failed to fetch models:', error);
    return NextResponse.json({ code: 500, error: 'Failed to fetch models' }, { status: 500 });
  }
}

// POST a new model
export async function POST(request) {
  try {
    const body = await request.json();
    const newModel = await createModelConfig(body);
    return NextResponse.json({ code: 0, data: newModel }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create model:', error);
    return NextResponse.json({ code: 500, error: 'Failed to create model' }, { status: 500 });
  }
}
