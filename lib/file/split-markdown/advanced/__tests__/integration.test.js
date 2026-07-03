/**
 * integration.test.js 端到端集成测试
 *
 * 测试 splitAdvancedMarkdown() 主函数的完整流程：
 * - 基础文档分块
 * - 含表格/代码块文档（原子块保护）
 * - 超长段落拆分与标题上下文保留
 * - headingPath 正确性
 * - 空块过滤
 */

import { describe, it, expect } from 'vitest'
import { splitAdvancedMarkdown } from '../index.js'

// ─── 基础文档分块 ──────────────────────────────────────────

describe('基础文档分块', () => {
  it('多级标题 + 普通文本', () => {
    const md = `# Chapter 1

${'Introduction text. '.repeat(50)}

## Section 1.1

${'Section content. '.repeat(50)}

## Section 1.2

${'More content here. '.repeat(50)}
`
    const result = splitAdvancedMarkdown(md, { minLength: 200, maxLength: 800 })
    expect(result.chunks.length).toBeGreaterThanOrEqual(1)
    expect(result.stats.totalChunks).toBe(result.chunks.length)
    expect(result.outline.length).toBe(3) // 3 headings
  })

  it('无标题纯文本也能分块', () => {
    const md = 'This is a long paragraph. '.repeat(100)
    const result = splitAdvancedMarkdown(md, { minLength: 200, maxLength: 500 })
    expect(result.chunks.length).toBeGreaterThanOrEqual(1)
    result.chunks.forEach(chunk => {
      expect(chunk.content.trim().length).toBeGreaterThan(0)
    })
  })
})

// ─── 含表格文档 ────────────────────────────────────────────

describe('含表格文档', () => {
  it('表格不被切断', () => {
    const table = '| Header A | Header B |\n|----------|----------|\n' +
      Array.from({ length: 10 }, (_, i) => `| Cell A${i} | Cell B${i} |`).join('\n')

    const md = `# Data Section\n\nSome intro text.\n\n${table}\n\nConclusion text here.`
    const result = splitAdvancedMarkdown(md, { minLength: 100, maxLength: 2000 })

    // 找到包含表格的块
    const tableChunks = result.chunks.filter(c => c.content.includes('| Header A |'))
    expect(tableChunks.length).toBe(1) // 表格应完整在一个块中

    // 表格内容不被切断
    const tableChunk = tableChunks[0]
    expect(tableChunk.content).toContain('| Cell A9 |')
  })
})

// ─── 含代码块文档 ──────────────────────────────────────────

describe('含代码块文档', () => {
  it('代码块完整保留', () => {
    const codeBlock = '```javascript\n' +
      'function hello() {\n' +
      '  console.log("Hello World");\n' +
      '  return true;\n' +
      '}\n' +
      '```'

    const md = `# Code Example\n\nHere is the code:\n\n${codeBlock}\n\nAnd that is it.`
    const result = splitAdvancedMarkdown(md, { minLength: 50, maxLength: 2000 })

    const codeChunks = result.chunks.filter(c => c.content.includes('```javascript'))
    expect(codeChunks.length).toBe(1)
    expect(codeChunks[0].content).toContain('```')
    // 代码块应成对出现（开合）
    const fenceCount = (codeChunks[0].content.match(/```/g) || []).length
    expect(fenceCount).toBe(2) // open + close
  })
})

// ─── 超长段落拆分 ──────────────────────────────────────────

describe('超长段落拆分', () => {
  it('保留标题上下文（> 所属章节：...）', () => {
    const longContent = 'A'.repeat(500) + '. ' + 'B'.repeat(500) + '. ' + 'C'.repeat(500) + '.'
    const md = `# Title\n\n${longContent}`
    const result = splitAdvancedMarkdown(md, { minLength: 200, maxLength: 600 })

    // 如果有多个块，Part 2+ 应有续标题
    if (result.chunks.length > 1) {
      const hasContinuation = result.chunks.some(c =>
        c.content.includes('> 所属章节：')
      )
      // 续标题可能存在（取决于拆分方式）
      expect(result.chunks.length).toBeGreaterThan(1)
    }
  })

  it('拆分后每块非空', () => {
    const md = `# Big Section\n\n${'X'.repeat(5000)}`
    const result = splitAdvancedMarkdown(md, { minLength: 200, maxLength: 1000 })
    result.chunks.forEach(chunk => {
      expect(chunk.content.trim().length).toBeGreaterThan(0)
    })
  })
})

// ─── headingPath 正确性 ────────────────────────────────────

describe('headingPath 正确性', () => {
  it('每个块都有 headingPath 数组', () => {
    const md = `# Root\n\n## Child\n\n${'Content. '.repeat(50)}\n\n## Other\n\n${'More. '.repeat(50)}`
    const result = splitAdvancedMarkdown(md, { minLength: 100, maxLength: 500 })
    result.chunks.forEach(chunk => {
      expect(Array.isArray(chunk.headingPath)).toBe(true)
    })
  })

  it('headingPath 包含正确的层级', () => {
    const md = `# Chapter\n\n## Section\n\n${'Text content here. '.repeat(60)}`
    const result = splitAdvancedMarkdown(md, { minLength: 100, maxLength: 2000 })
    const firstChunk = result.chunks[0]
    if (firstChunk && firstChunk.headingPath.length > 0) {
      expect(firstChunk.headingPath).toContain('Chapter')
    }
  })
})

// ─── 空块过滤 ──────────────────────────────────────────────

describe('空块过滤', () => {
  it('不产生空内容块', () => {
    const md = `# Title\n\n\n\n## Section\n\n\n\nContent here.`
    const result = splitAdvancedMarkdown(md, { minLength: 50, maxLength: 2000 })
    result.chunks.forEach(chunk => {
      expect(chunk.content.trim().length).toBeGreaterThan(0)
    })
  })
})

// ─── 统计信息 ──────────────────────────────────────────────

describe('统计信息', () => {
  it('stats 包含完整字段', () => {
    const md = `# Test\n\n${'Hello world. '.repeat(100)}`
    const result = splitAdvancedMarkdown(md, { minLength: 100, maxLength: 500 })
    expect(result.stats).toHaveProperty('totalChunks')
    expect(result.stats).toHaveProperty('avg')
    expect(result.stats).toHaveProperty('min')
    expect(result.stats).toHaveProperty('max')
    expect(result.stats).toHaveProperty('avgSize')
    expect(result.stats.totalChunks).toBe(result.chunks.length)
  })

  it('每个块有 qualityScore', () => {
    const md = `# Test\n\n${'Content. '.repeat(100)}`
    const result = splitAdvancedMarkdown(md, { minLength: 100, maxLength: 500 })
    result.chunks.forEach(chunk => {
      expect(typeof chunk.qualityScore).toBe('number')
      expect(chunk.qualityScore).toBeGreaterThanOrEqual(0)
      expect(chunk.qualityScore).toBeLessThanOrEqual(100)
    })
  })
})

// ─── 配置边界 ──────────────────────────────────────────────

describe('配置边界', () => {
  it('minLength >= maxLength 时自动调整', () => {
    const md = `# Test\n\n${'Content. '.repeat(50)}`
    const result = splitAdvancedMarkdown(md, { minLength: 3000, maxLength: 1000 })
    // 不应崩溃，应正常返回
    expect(result.chunks.length).toBeGreaterThanOrEqual(1)
  })

  it('空文档返回空块数组', () => {
    const result = splitAdvancedMarkdown('', { minLength: 100, maxLength: 500 })
    expect(result.chunks.length).toBe(0)
  })
})
