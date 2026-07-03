/**
 * atomics.js 单元测试
 *
 * 测试原子块检测与保护模块的核心逻辑：
 * - 各类原子块检测（代码块、公式、表格、列表）
 * - 占位符保护与还原往返测试
 * - 重叠区间合并
 * - 优先级处理
 */

import { describe, it, expect } from 'vitest'
import {
  detectAndProtect,
  restore,
  containsPlaceholder,
  makePlaceholder,
  PLACEHOLDER_PREFIX,
  PLACEHOLDER_SUFFIX
} from '../atomics.js'

// ─── 占位符工具 ────────────────────────────────────────────

describe('makePlaceholder', () => {
  it('应生成正确的占位符格式', () => {
    expect(makePlaceholder(0)).toBe('\x00ATOM_0\x00')
    expect(makePlaceholder(5)).toBe('\x00ATOM_5\x00')
  })
})

describe('containsPlaceholder', () => {
  it('含占位符返回 true', () => {
    expect(containsPlaceholder('hello \x00ATOM_0\x00 world')).toBe(true)
  })
  it('不含占位符返回 false', () => {
    expect(containsPlaceholder('hello world')).toBe(false)
  })
})

// ─── 围栏代码块检测 ────────────────────────────────────────

describe('detectAndProtect - 围栏代码块', () => {
  it('应保护 ``` 围栏代码块', () => {
    const text = 'before\n```js\nconst x = 1\n```\nafter'
    const { protectedText, atomMap } = detectAndProtect(text)
    expect(protectedText).not.toContain('const x = 1')
    expect(atomMap.length).toBeGreaterThanOrEqual(1)
    expect(atomMap.some(a => a.type === 'code')).toBe(true)
  })

  it('应保护 ~~~ 围栏代码块', () => {
    const text = 'before\n~~~python\nprint("hi")\n~~~\nafter'
    const { protectedText, atomMap } = detectAndProtect(text)
    expect(protectedText).not.toContain('print("hi")')
    expect(atomMap.some(a => a.type === 'code')).toBe(true)
  })

  it('无代码块时不产生 code 类型原子块', () => {
    const text = 'just plain text\nwith multiple lines'
    const { atomMap } = detectAndProtect(text)
    expect(atomMap.some(a => a.type === 'code')).toBe(false)
  })
})

// ─── 显示数学公式检测 ──────────────────────────────────────

describe('detectAndProtect - 显示数学公式', () => {
  it('应保护 $$...$$ 公式块', () => {
    const text = 'text\n$$\nE = mc^2\n$$\nmore text'
    const { protectedText, atomMap } = detectAndProtect(text)
    expect(protectedText).not.toContain('E = mc^2')
    expect(atomMap.some(a => a.type === 'math_display')).toBe(true)
  })

  it('应处理多组 $$ 公式', () => {
    const text = '$$\na=1\n$$\nmiddle\n$$\nb=2\n$$'
    const { atomMap } = detectAndProtect(text)
    const mathBlocks = atomMap.filter(a => a.type === 'math_display')
    expect(mathBlocks.length).toBe(2)
  })
})

// ─── Markdown 表格检测 ─────────────────────────────────────

describe('detectAndProtect - Markdown 表格', () => {
  it('应保护标准 Markdown 表格', () => {
    const text = '| A | B |\n|---|---|\n| 1 | 2 |'
    const { protectedText, atomMap } = detectAndProtect(text)
    expect(protectedText).not.toContain('| 1 | 2 |')
    expect(atomMap.some(a => a.type === 'table')).toBe(true)
  })

  it('不应将无分隔行的管道文本识别为表格', () => {
    const text = '| just pipes |\n| no separator |'
    const { atomMap } = detectAndProtect(text)
    expect(atomMap.some(a => a.type === 'table')).toBe(false)
  })
})

// ─── HTML 表格检测 ─────────────────────────────────────────

describe('detectAndProtect - HTML 表格', () => {
  it('应保护 <table>...</table>', () => {
    const text = 'before<table><tr><td>cell</td></tr></table>after'
    const { protectedText, atomMap } = detectAndProtect(text)
    expect(protectedText).not.toContain('<table>')
    expect(atomMap.some(a => a.type === 'html_table')).toBe(true)
  })

  it('不完整的 <table> 不应保护', () => {
    const text = '<table><tr><td>unclosed'
    const { atomMap } = detectAndProtect(text)
    expect(atomMap.some(a => a.type === 'html_table')).toBe(false)
  })
})

// ─── 列表检测 ──────────────────────────────────────────────

describe('detectAndProtect - 列表', () => {
  it('应保护至少 2 项的无序列表', () => {
    const text = '- item 1\n- item 2\n- item 3'
    const { protectedText, atomMap } = detectAndProtect(text)
    expect(protectedText).not.toContain('- item 2')
    expect(atomMap.some(a => a.type === 'list')).toBe(true)
  })

  it('应保护至少 2 项的有序列表', () => {
    const text = '1. first\n2. second'
    const { protectedText, atomMap } = detectAndProtect(text)
    expect(atomMap.some(a => a.type === 'list')).toBe(true)
  })

  it('单项列表不应作为原子块保护', () => {
    const text = '- only one item'
    const { atomMap } = detectAndProtect(text)
    expect(atomMap.some(a => a.type === 'list')).toBe(false)
  })
})

// ─── 保护与还原往返测试 ────────────────────────────────────

describe('detectAndProtect + restore 往返', () => {
  it('保护后还原应得到原文', () => {
    const text = '# Title\n\nSome text.\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```js\nconst x = 1\n```\n\nMore text.'
    const { protectedText, atomMap } = detectAndProtect(text)
    const restored = restore(protectedText, atomMap)
    expect(restored).toBe(text)
  })

  it('复杂文档（含公式+表格+代码块）的往返', () => {
    const text = '# Heading\n\n$$\nE=mc^2\n$$\n\n| Col |\n|-----|\n| Val |\n\n```python\nprint("hello")\n```\n\n- item 1\n- item 2'
    const { protectedText, atomMap } = detectAndProtect(text)
    const restored = restore(protectedText, atomMap)
    expect(restored).toBe(text)
  })
})

// ─── 优先级处理 ────────────────────────────────────────────

describe('优先级处理', () => {
  it('代码块优先级高于表格', () => {
    // 代码块内包含管道符，不应被识别为表格
    const text = '```\n| not a table |\n|---|---|\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |'
    const { atomMap } = detectAndProtect(text)
    const codeBlocks = atomMap.filter(a => a.type === 'code')
    const tableBlocks = atomMap.filter(a => a.type === 'table')
    expect(codeBlocks.length).toBe(1)
    expect(tableBlocks.length).toBe(1)
  })
})
