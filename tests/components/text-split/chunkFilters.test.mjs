import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countActiveChunkFilters,
  createDefaultChunkFilters,
  filterChunks,
  getChunkFilterSliderMax,
  getMaxChunkSize,
  toAppliedChunkFilters,
  toChunkFilterDialogState
} from '../../../components/text-split/chunkFilters.mjs';

const chunks = [
  { id: 'empty', content: '', size: 0, Questions: [] },
  { id: 'normal', content: 'A regular chunk', size: 500, Questions: [] },
  { id: 'boundary', content: 'At the boundary', size: 10000, Questions: [{}] },
  { id: 'long', content: 'A valid long chunk', size: 15000, Questions: [] }
];

test('default filters keep regular and long chunks visible', () => {
  const filters = createDefaultChunkFilters();

  assert.deepEqual(
    filterChunks(chunks, filters).map(chunk => chunk.id),
    ['empty', 'normal', 'boundary', 'long']
  );
  assert.equal(countActiveChunkFilters(filters), 0);
  assert.equal(getMaxChunkSize(chunks), 15000);
});

test('empty chunk lists have a usable unbounded default range', () => {
  const filters = createDefaultChunkFilters();
  const sliderMax = getChunkFilterSliderMax(getMaxChunkSize([]), filters);

  assert.deepEqual(filterChunks([], filters), []);
  assert.equal(sliderMax, 1);
  assert.deepEqual(toChunkFilterDialogState(filters, sliderMax).sizeRange, [0, 1]);
});

test('explicit size bounds are inclusive and exclude values outside the range', () => {
  const filters = { ...createDefaultChunkFilters(), sizeRange: [500, 10000] };

  assert.deepEqual(
    filterChunks(chunks, filters).map(chunk => chunk.id),
    ['normal', 'boundary']
  );
  assert.equal(countActiveChunkFilters(filters), 1);
});

test('question filters preserve false and compose with keyword filters', () => {
  const filters = {
    ...createDefaultChunkFilters(),
    contentKeyword: 'chunk',
    hasQuestions: false
  };

  assert.deepEqual(
    filterChunks(chunks, filters).map(chunk => chunk.id),
    ['normal', 'long']
  );
  assert.equal(countActiveChunkFilters(filters), 2);
});

test('apply, reopen, and reset preserve the same filter semantics', () => {
  const defaultFilters = createDefaultChunkFilters();
  const sliderMax = getChunkFilterSliderMax(getMaxChunkSize(chunks), defaultFilters);
  const initialDialogState = toChunkFilterDialogState(defaultFilters, sliderMax);

  const appliedFilters = toAppliedChunkFilters(
    { ...initialDialogState, sizeRange: [500, 10000], hasQuestions: false },
    sliderMax
  );
  assert.deepEqual(appliedFilters, {
    contentKeyword: '',
    sizeRange: [500, 10000],
    hasQuestions: false
  });
  assert.deepEqual(toChunkFilterDialogState(appliedFilters, sliderMax), appliedFilters);

  const resetDialogState = toChunkFilterDialogState(createDefaultChunkFilters(), sliderMax);
  const resetFilters = toAppliedChunkFilters(resetDialogState, sliderMax);
  assert.deepEqual(resetFilters, defaultFilters);
  assert.equal(countActiveChunkFilters(resetFilters), 0);
  assert.deepEqual(
    filterChunks(chunks, resetFilters).map(chunk => chunk.id),
    ['empty', 'normal', 'boundary', 'long']
  );
});

test('a finite upper bound at the slider maximum remains finite until the upper thumb changes', () => {
  const sliderMax = 10000;
  const dialogFilters = {
    contentKeyword: '',
    sizeRange: [500, sliderMax],
    hasQuestions: null
  };

  assert.deepEqual(toAppliedChunkFilters(dialogFilters, sliderMax, false).sizeRange, [500, 10000]);
  assert.deepEqual(toAppliedChunkFilters(dialogFilters, sliderMax, true).sizeRange, [500, null]);
});
