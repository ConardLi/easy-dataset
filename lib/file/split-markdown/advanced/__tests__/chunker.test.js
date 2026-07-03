/**
 * chunker.js 单元测试
 *
 * 测试核心分块引擎的关键逻辑：
 * - 段落文本构建
 * - 超长内容分割
 * - 主分块逻辑
 * - 标题路径构建
 * - 语义亲合度计算
 * - 短块合并策略
 */

import { describe, it, expect } from 'vitest'
import {
  buildSectionText,
  splitLongContent,
  chunkSections,
  buildFullHeadingPath,
  computeSemanticAffinity,
  mergeShortChunks,
  normalizeHeadings
} from '../chunker.js'

// ─── buildSectionText ──────────────────────────────────────

describe('buildSectionText', () => {
  it('有标题时构建标题行 + 内容', () => {
    const section = { heading: 'Introduction', level: 2, content: 'Some text here.' }
    expect(buildSectionText(section)).toBe('## Introduction\nSome text here.')
  })

  it('无标题时只返回内容', () => {
    const section = { heading: null, level: 0, content: 'Orphan paragraph.' }
    expect(buildSectionText(section)).toBe('Orphan paragraph.')
  })

  it('处理多级标题', () => {
    const section = { heading: 'Deep', level: 4, content: 'Content' }
    expect(buildSectionText(section)).toBe('#### Deep\nContent')
  })
})

// ─── normalizeHeadings ─────────────────────────────────────

describe('normalizeHeadings', () => {
  it('将对象数组归一化为字符串数组', () => {
    const headings = [{ heading: 'A', level: 1 }, { heading: 'B', level: 2 }]
    expect(normalizeHeadings(headings)).toEqual(['A', 'B'])
  })

  it('字符串数组保持不变', () => {
    expect(normalizeHeadings(['X', 'Y'])).toEqual(['X', 'Y'])
  })

  it('null/undefined 返回空数组', () => {
    expect(normalizeHeadings(null)).toEqual([])
    expect(normalizeHeadings(undefined)).toEqual([])
  })
})

// ─── splitLongContent ──────────────────────────────────────

describe('splitLongContent', () => {
  it('短于 maxLength 时不分割', () => {
    const content = 'Short content.'
    expect(splitLongContent(content, 100)).toEqual(['Short content.'])
  })

  it('按段落分割', () => {
    const content = 'Para one.\n\nPara two.\n\nPara three.'
    const result = splitLongContent(content, 25)
    expect(result.length).toBeGreaterThanOrEqual(2)
    result.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(25 + 20) // 允许段落级超出
    })
  })

  it('尊重占位符不切断', () => {
    const placeholder = '\x00ATOM_0\x00'
    const content = `Before text.\n\n${placeholder}\n\nAfter text.`
    const result = splitLongContent(content, 20)
    // 占位符所在块应完整保留
    const atomChunk = result.find(c => c.includes(placeholder))
    expect(atomChunk).toContain(placeholder)
  })

  it('过滤空块', () => {
    const content = '   \n\n   \n\nReal content here.'
    const result = splitLongContent(content, 100)
    result.forEach(chunk => {
      expect(chunk.trim().length).toBeGreaterThan(0)
    })
  })
})

// ─── buildFullHeadingPath ──────────────────────────────────

describe('buildFullHeadingPath', () => {
  const outline = [
    { title: 'Chapter 1', level: 1, position: 0 },
    { title: 'Section 1.1', level: 2, position: 20 },
    { title: 'Section 1.1.1', level: 3, position: 50 },
    { title: 'Section 1.2', level: 2, position: 80 },
    { title: 'Chapter 2', level: 1, position: 100 }
  ]

  it('构建完整层级路径', () => {
    const headings = [{ heading: 'Section 1.1.1', level: 3, position: 50 }]
    const path = buildFullHeadingPath(headings, outline)
    expect(path).toEqual(['Chapter 1', 'Section 1.1', 'Section 1.1.1'])
  })

  it('顶级标题只有自身', () => {
    const headings = [{ heading: 'Chapter 2', level: 1, position: 100 }]
    const path = buildFullHeadingPath(headings, outline)
    expect(path).toEqual(['Chapter 2'])
  })

  it('多个标题取最深层级', () => {
    const headings = [
      { heading: 'Section 1.1', level: 2, position: 20 },
      { heading: 'Section 1.1.1', level: 3, position: 50 }
    ]
    const path = buildFullHeadingPath(headings, outline)
    expect(path).toEqual(['Chapter 1', 'Section 1.1', 'Section 1.1.1'])
  })

  it('无大纲时退回 headings 本身', () => {
    const headings = [{ heading: 'Some Title', level: 2, position: 0 }]
    const path = buildFullHeadingPath(headings, [])
    expect(path).toEqual(['Some Title'])
  })

  it('空 headings 返回空数组', () => {
    expect(buildFullHeadingPath([], outline)).toEqual([])
    expect(buildFullHeadingPath(null, outline)).toEqual([])
  })
})

// ─── computeSemanticAffinity ───────────────────────────────

describe('computeSemanticAffinity', () => {
  const outline = [
    { title: 'A', level: 1, position: 0 },
    { title: 'A.1', level: 2, position: 10 },
    { title: 'A.2', level: 2, position: 30 },
    { title: 'B', level: 1, position: 50 }
  ]

  it('共同前缀提高亲合度', () => {
    const chunkA = { headings: [{ heading: 'A.1', level: 2 }] }
    const chunkB = { headings: [{ heading: 'A.1', level: 2 }] }
    const affinity = computeSemanticAffinity(chunkA, chunkB, outline)
    expect(affinity).toBeGreaterThan(3)
  })

  it('同一父标题下的兄弟节点有亲合度', () => {
    const chunkA = { headings: [{ heading: 'A.1', level: 2 }] }
    const chunkB = { headings: [{ heading: 'A.2', level: 2 }] }
    const affinity = computeSemanticAffinity(chunkA, chunkB, outline)
    expect(affinity).toBeGreaterThan(0)
  })

  it('不同章节亲合度较低', () => {
    const chunkA = { headings: [{ heading: 'A.1', level: 2 }] }
    const chunkB = { headings: [{ heading: 'B', level: 1 }] }
    const affinity = computeSemanticAffinity(chunkA, chunkB, outline)
    expect(affinity).toBeLessThanOrEqual(1.5)
  })

  it('双方都无标题返回中等亲合度', () => {
    const affinity = computeSemanticAffinity({ headings: [] }, { headings: [] }, outline)
    expect(affinity).toBe(2)
  })

  it('一方无标题返回弱亲合度', () => {
    const chunkA = { headings: [{ heading: 'A', level: 1 }] }
    const chunkB = { headings: [] }
    const affinity = computeSemanticAffinity(chunkA, chunkB, outline)
    expect(affinity).toBe(0.5)
  })
})

// ─── chunkSections ─────────────────────────────────────────

describe('chunkSections', () => {
  const outline = [
    { title: 'Intro', level: 1, position: 0 },
    { title: 'Details', level: 2, position: 50 }
  ]

  it('合并短段落到 maxLength 以内', () => {
    const sections = [
      { heading: 'Intro', level: 1, content: 'Short intro.', position: 0 },
      { heading: 'Details', level: 2, content: 'Some details.', position: 50 }
    ]
    const result = chunkSections(sections, outline, { maxLength: 2000 })
    expect(result.length).toBe(1) // 两段合并
    expect(result[0].content).toContain('Intro')
    expect(result[0].content).toContain('Details')
  })

  it('超长段落拆分', () => {
    const longContent = 'A'.repeat(3000)
    const sections = [
      { heading: 'Big', level: 1, content: longContent, position: 0 }
    ]
    const result = chunkSections(sections, outline, { maxLength: 1000 })
    expect(result.length).toBeGreaterThan(1)
    result.forEach(chunk => {
      expect(chunk.content.trim().length).toBeGreaterThan(0)
    })
  })

  it('不产生空块', () => {
    const sections = [
      { heading: null, level: 0, content: '', position: 0 },
      { heading: 'Real', level: 1, content: 'Real content', position: 10 }
    ]
    const result = chunkSections(sections, outline, { maxLength: 2000 })
    result.forEach(chunk => {
      expect(chunk.content.trim().length).toBeGreaterThan(0)
    })
  })
})

// ─── mergeShortChunks ──────────────────────────────────────

describe('mergeShortChunks', () => {
  const outline = [
    { title: 'A', level: 1, position: 0 },
    { title: 'A.1', level: 2, position: 20 },
    { title: 'A.2', level: 2, position: 60 }
  ]

  it('短块合并到语义亲合度更高的邻居', () => {
    const chunks = [
      { content: 'A'.repeat(1000), headings: [{ heading: 'A', level: 1 }], headingPath: ['A'] },
      { content: 'Short', headings: [{ heading: 'A.1', level: 2 }], headingPath: ['A', 'A.1'] },
      { content: 'B'.repeat(1000), headings: [{ heading: 'A.2', level: 2 }], headingPath: ['A', 'A.2'] }
    ]
    const result = mergeShortChunks(chunks, 500, 2000, outline)
    // 短块应被合并到某个邻居
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('合并后不超过安全上限', () => {
    const chunks = [
      { content: 'A'.repeat(3000), headings: [{ heading: 'A', level: 1 }], headingPath: ['A'] },
      { content: 'B'.repeat(100), headings: [{ heading: 'A.1', level: 2 }], headingPath: ['A', 'A.1'] }
    ]
    const result = mergeShortChunks(chunks, 500, 2000, outline)
    // 合并后超过 maxLength * 1.2 = 2400，不合并
    expect(result.length).toBe(2)
  })

  it('合并后 headingPath 重新计算', () => {
    const chunks = [
      { content: 'A'.repeat(1000), headings: [{ heading: 'A', level: 1 }], headingPath: ['A'] },
      { content: 'Short', headings: [{ heading: 'A.1', level: 2 }], headingPath: ['A', 'A.1'] }
    ]
    const result = mergeShortChunks(chunks, 500, 4000, outline)
    if (result.length === 1) {
      // 合并后 headingPath 应包含 A.1
      expect(result[0].headingPath).toContain('A.1')
    }
  })

  it('清理合并结果中的续标题行', () => {
    const chunks = [
      { content: 'First part.', headings: [{ heading: 'A', level: 1 }], headingPath: ['A'] },
      { content: '> 所属章节：A\n\nSecond part.', headings: [{ heading: 'A', level: 1 }], headingPath: ['A'] }
    ]
    const result = mergeShortChunks(chunks, 500, 4000, outline)
    if (result.length === 1) {
      expect(result[0].content).not.toContain('> 所属章节：')
    }
  })

  it('单块或空数组直接返回', () => {
    expect(mergeShortChunks([], 500, 2000, [])).toEqual([])
    const single = [{ content: 'Only one', headings: [], headingPath: [] }]
    expect(mergeShortChunks(single, 500, 2000, [])).toEqual(single)
  })
})
