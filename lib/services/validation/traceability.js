'use server';

import { db } from '@/lib/db/index';
import { getChunkById, getChunksByFileId } from '@/lib/db/chunks';
import logger from '@/lib/util/logger';

/**
 * Normalizes text for comparison by removing whitespace and punctuation, and converting to lower case.
 * @param {string} text - The text to normalize.
 * @returns {string} - The normalized text.
 */
function normalizeText(text) {
  if (!text) return '';
  return text.replace(/[\s\p{P}]/gu, '').toLowerCase();
}

/**
 * Verifies the traceability of a dataset's answer by checking its CoT against the source context.
 * @param {string} datasetId - The ID of the dataset to verify.
 * @returns {Promise<void>}
 */
export async function verifyTraceability(datasetId) {
  try {
    logger.info(`Starting traceability verification for dataset: ${datasetId}`);

    const dataset = await db.datasets.findUnique({
      where: { id: datasetId },
      include: {
        question: { // Assuming a relation 'question' exists on the Dataset model
          select: { metadata: true, chunkId: true }
        }
      }
    });

    if (!dataset || !dataset.cot || !dataset.question) {
      logger.warn(`Verification skipped for ${datasetId}: Dataset, CoT, or associated question not found.`);
      await db.datasets.update({
        where: { id: datasetId },
        data: { validationStatus: 'verification_failed' },
      });
      return;
    }

    const { cot, question } = dataset;
    let metadata = null;
    try {
      if (question.metadata) metadata = JSON.parse(question.metadata);
    } catch (e) {
      logger.warn(`Failed to parse metadata for dataset ${datasetId}. Proceeding with local context.`);
    }

    // 1. Get the full source context based on metadata
    let sourceContext = '';
    if (metadata?.type === 'contextual') {
      const currentChunk = await getChunkById(question.chunkId);
      const prevChunk = metadata.previousChunkId ? await getChunkById(metadata.previousChunkId) : null;
      const nextChunk = metadata.nextChunkId ? await getChunkById(metadata.nextChunkId) : null;
      sourceContext = [prevChunk?.content, currentChunk?.content, nextChunk?.content].filter(Boolean).join(' ');
    } else if (metadata?.type === 'global') {
      const fileChunks = await getChunksByFileId(metadata.fileId);
      sourceContext = fileChunks.map(c => c.content).join(' ');
    } else {
      // Default to local context
      const localChunk = await getChunkById(question.chunkId);
      sourceContext = localChunk?.content || '';
    }

    if (!sourceContext) {
        logger.warn(`Verification skipped for ${datasetId}: Source context is empty.`);
        await db.datasets.update({
            where: { id: datasetId },
            data: { validationStatus: 'verification_failed', traceabilityScore: 0.0 },
        });
        return;
    }

    // 2. Extract quotes from CoT
    const quotes = [...cot.matchAll(/QUOTE{(.*?)}/g)].map(match => match[1]);

    if (quotes.length === 0) {
      logger.info(`Verification for ${datasetId} completed: No quotes found in CoT. Marked as unverified.`);
      await db.datasets.update({
        where: { id: datasetId },
        data: { validationStatus: 'unverified', traceabilityScore: null },
      });
      return;
    }

    // 3. Compare quotes against the source context
    const normalizedSourceContext = normalizeText(sourceContext);
    let matchedQuotes = 0;

    for (const quote of quotes) {
      if (normalizedSourceContext.includes(normalizeText(quote))) {
        matchedQuotes++;
      } else {
        logger.warn(`Quote not found in source for dataset ${datasetId}: "${quote}"`);
      }
    }

    // 4. Calculate score and determine status
    const traceabilityScore = matchedQuotes / quotes.length;
    let validationStatus = 'suspicious';
    if (traceabilityScore === 1.0) {
      validationStatus = 'verified';
    } else if (traceabilityScore >= 0.8) {
      validationStatus = 'partially_verified';
    }

    logger.info(`Verification for ${datasetId} completed. Score: ${traceabilityScore}, Status: ${validationStatus}`);

    // 5. Update the dataset record
    await db.datasets.update({
      where: { id: datasetId },
      data: {
        traceabilityScore,
        validationStatus,
      },
    });

  } catch (error) {
    logger.error(`Error during traceability verification for dataset ${datasetId}:`, error);
    await db.datasets.update({
      where: { id: datasetId },
      data: { validationStatus: 'verification_failed' },
    }).catch(e => logger.error(`Failed to mark dataset ${datasetId} as failed:`, e));
  }
}
