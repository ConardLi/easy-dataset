export function createDefaultChunkFilters() {
  return {
    contentKeyword: '',
    sizeRange: [0, null],
    hasQuestions: null
  };
}

function getChunkSize(chunk) {
  const size = Number(chunk?.size);
  return Number.isFinite(size) ? size : 0;
}

function getSizeRange(filters = {}) {
  const sizeRange = Array.isArray(filters.sizeRange) ? filters.sizeRange : [];
  const minSize = Number(sizeRange[0]);
  const maxSize = sizeRange[1] === null || sizeRange[1] === undefined ? null : Number(sizeRange[1]);

  return [Number.isFinite(minSize) ? minSize : 0, Number.isFinite(maxSize) ? maxSize : null];
}

export function getMaxChunkSize(chunks = []) {
  return chunks.reduce((maxSize, chunk) => Math.max(maxSize, getChunkSize(chunk)), 0);
}

export function getChunkFilterSliderMax(maxChunkSize, filters = {}) {
  const [, filterMaxSize] = getSizeRange(filters);
  return Math.max(1, Number(maxChunkSize) || 0, filterMaxSize || 0);
}

export function toChunkFilterDialogState(filters = {}, sliderMax) {
  const [minSize, maxSize] = getSizeRange(filters);

  return {
    contentKeyword: filters.contentKeyword || '',
    sizeRange: [minSize, maxSize ?? sliderMax],
    hasQuestions: filters.hasQuestions ?? null
  };
}

export function toAppliedChunkFilters(dialogFilters, sliderMax, maxSizeUnbounded = null) {
  const [minSize, maxSize] = getSizeRange(dialogFilters);
  const shouldRemoveMaxSize = maxSizeUnbounded ?? maxSize >= sliderMax;

  return {
    contentKeyword: dialogFilters.contentKeyword || '',
    sizeRange: [minSize, shouldRemoveMaxSize ? null : maxSize],
    hasQuestions: dialogFilters.hasQuestions ?? null
  };
}

export function countActiveChunkFilters(filters = {}) {
  const [minSize, maxSize] = getSizeRange(filters);
  let count = 0;

  if (filters.contentKeyword) count++;
  if (minSize > 0 || maxSize !== null) count++;
  if (filters.hasQuestions !== null && filters.hasQuestions !== undefined) count++;

  return count;
}

export function filterChunks(chunks = [], filters = {}) {
  const keyword = filters.contentKeyword?.toLowerCase();
  const [minSize, maxSize] = getSizeRange(filters);

  return chunks.filter(chunk => {
    if (keyword && !chunk.content?.toLowerCase().includes(keyword)) {
      return false;
    }

    const size = getChunkSize(chunk);
    if (size < minSize || (maxSize !== null && size > maxSize)) {
      return false;
    }

    if (filters.hasQuestions !== null && filters.hasQuestions !== undefined) {
      const hasQuestions = Boolean(chunk.Questions?.length);
      if (filters.hasQuestions !== hasQuestions) {
        return false;
      }
    }

    return true;
  });
}
