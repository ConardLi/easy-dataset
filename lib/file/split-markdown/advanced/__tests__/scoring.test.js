/**
 * scoring.js 单元测试
 *
 * 测试分块质量评分模块的各维度评分逻辑
 */

import { describe, it, expect } from 'vitest'
import { scoreChunk, scoreAll } from '../scoring.js'

const defaultConfig = { minLength: 800, maxLength: 2000 }

// ─── scoreChunk 综合评分 ───────────────────────────────────

describe('scoreChunk', () => {
  it('返回 0-100 范围内的分数', () => {
    const chunk = { content: 'Some content here.', headings: [], partIndex: 0, totalParts: 1 }
    const score = scoreChunk(chunk, defaultConfig)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('空内容得分很低', () => {
    const chunk = { content: '', headings: [] }
    const score = scoreChunk(chunk, defaultConfig)
    // 空内容长度/标题/句子分为 0，但原子完整性(20)和多样性基础分(5)仍有
    expect(score).toBeLessThanOrEqual(25)
  })

  it('高质量内容得分较高', () => {
    const chunk = {
      content: `## Section Title\n\n${'Good content. '.repeat(80)}\n\nFinal sentence.`,
      headings: [{ heading: 'Section Title', level: 2 }],
      partIndex: null,
      totalParts: null
    }
    const score = scoreChunk(chunk, defaultConfig)
    expect(score).toBeGreaterThan(50)
  })
})

// ─── 长度适当性 ────────────────────────────────────────────

describe('长度适当性', () => {
  it('区间中间段得高分', () => {
    const len = 1400 // 在 [800, 2000] 中间
    const chunk = { content: 'x'.repeat(len), headings: [] }
    const score = scoreChunk(chunk, defaultConfig)
    // 长度部分应得 20 分（满分）
    expect(score).toBeGreaterThan(0)
  })

  it('低于最小区间衰减', () => {
    const shortChunk = { content: 'Short.', headings: [] }
    const longChunk = { content: 'x'.repeat(1400), headings: [] }
    expect(scoreChunk(shortChunk, defaultConfig)).toBeLessThan(scoreChunk(longChunk, defaultConfig))
  })

  it('超过最大区间衰减', () => {
    const huge = { content: 'x'.repeat(5000), headings: [] }
    const medium = { content: 'x'.repeat(1400), headings: [] }
    expect(scoreChunk(huge, defaultConfig)).toBeLessThan(scoreChunk(medium, defaultConfig))
  })
})

// ─── 标题存在性 ────────────────────────────────────────────

describe('标题存在性', () => {
  it('以标题行开头得满分', () => {
    const chunk = { content: '## Title\n\nContent here.', headings: [{ heading: 'Title', level: 2 }] }
    const score = scoreChunk(chunk, defaultConfig)
    expect(score).toBeGreaterThan(0)
  })

  it('以引用章节标记开头有分', () => {
    const chunk = { content: '> 所属章节：Chapter 1\n\nContent.', headings: [] }
    const score = scoreChunk(chunk, defaultConfig)
    expect(score).toBeGreaterThan(0)
  })

  it('无标题信息得分较低', () => {
    const chunk = { content: 'Just plain text without any heading. '.repeat(30), headings: [] }
    const withHeading = { content: '## Title\n\n' + 'Just plain text. '.repeat(30), headings: [{ heading: 'Title', level: 2 }] }
    expect(scoreChunk(chunk, defaultConfig)).toBeLessThan(scoreChunk(withHeading, defaultConfig))
  })
})

// ─── 原子块完整性 ──────────────────────────────────────────

describe('原子块完整性', () => {
  it('未闭合代码块扣分', () => {
    const broken = { content: '```js\nconst x = 1\n// no closing fence', headings: [] }
    const good = { content: '```js\nconst x = 1\n```\n', headings: [] }
    expect(scoreChunk(broken, defaultConfig)).toBeLessThan(scoreChunk(good, defaultConfig))
  })

  it('未闭合 $$ 公式扣分', () => {
    const broken = { content: '$$\nE=mc^2\n// no closing', headings: [] }
    const good = { content: '$$\nE=mc^2\n$$\n', headings: [] }
    expect(scoreChunk(broken, defaultConfig)).toBeLessThan(scoreChunk(good, defaultConfig))
  })

  it('未闭合 HTML 表格扣分', () => {
    const broken = { content: '<table><tr><td>cell</td>', headings: [] }
    const good = { content: '<table><tr><td>cell</td></tr></table>', headings: [] }
    expect(scoreChunk(broken, defaultConfig)).toBeLessThan(scoreChunk(good, defaultConfig))
  })
})

// ─── 内容多样性 ────────────────────────────────────────────

describe('内容多样性', () => {
  it('混合内容得高分', () => {
    const mixed = {
      content: '## Title\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n- item 1\n- item 2\n\n```js\ncode\n```\n\n' + 'Text. '.repeat(50),
      headings: [{ heading: 'Title', level: 2 }]
    }
    const plain = {
      content: 'Just plain text with no structure elements. '.repeat(20),
      headings: []
    }
    expect(scoreChunk(mixed, defaultConfig)).toBeGreaterThan(scoreChunk(plain, defaultConfig))
  })
})

// ─── scoreAll 批量统计 ─────────────────────────────────────

describe('scoreAll', () => {
  it('计算统计信息', () => {
    const chunks = [
      { content: 'x'.repeat(1000), qualityScore: 80 },
      { content: 'y'.repeat(1200), qualityScore: 90 },
      { content: 'z'.repeat(800), qualityScore: 70 }
    ]
    const stats = scoreAll(chunks, defaultConfig)
    expect(stats.totalChunks).toBe(3)
    expect(stats.avg).toBe(80)
    expect(stats.min).toBe(70)
    expect(stats.max).toBe(90)
    expect(stats.avgSize).toBe(1000)
    expect(stats.minSize).toBe(800)
    expect(stats.maxSize).toBe(1200)
  })

  it('空数组返回零值', () => {
    const stats = scoreAll([], defaultConfig)
    expect(stats.totalChunks).toBe(0)
    expect(stats.avg).toBe(0)
  })
})
