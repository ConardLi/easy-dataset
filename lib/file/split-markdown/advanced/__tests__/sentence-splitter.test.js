/**
 * sentence-splitter.js 单元测试
 *
 * 测试智能句子分割模块：
 * - 有效分割点判断（缩写、数字、省略号等）
 * - 句子分割主逻辑
 */

import { describe, it, expect } from 'vitest'
import { splitSentences, isValidBreak, ABBREVIATIONS } from '../sentence-splitter.js'

// ─── isValidBreak ──────────────────────────────────────────

describe('isValidBreak', () => {
  it('中文句号总是有效分割点', () => {
    expect(isValidBreak('这是句子。后面还有', 4)).toBe(true)
  })

  it('中文感叹号总是有效', () => {
    expect(isValidBreak('太好了！继续', 3)).toBe(true)
  })

  it('中文问号总是有效', () => {
    const text = '是吗？是的'
    // ？ 在位置 2（UTF-16 编码）
    expect(isValidBreak(text, 2)).toBe(true)
  })

  it('省略号 ... 不分割', () => {
    // "..." 中间的 . 不应分割
    expect(isValidBreak('text...more', 5)).toBe(false)
    expect(isValidBreak('text...more', 6)).toBe(false)
  })

  it('数字上下文中的 . 不分割（如 3.14）', () => {
    // "3.14" 中 . 在位置 1
    expect(isValidBreak('3.14', 1)).toBe(false)
  })

  it('缩写后的 . 不分割（如 Dr.）', () => {
    // "Dr. Smith" 中 . 在位置 2
    expect(isValidBreak('Dr. Smith', 2)).toBe(false)
  })

  it('et al. 后的 . 不分割', () => {
    const text = 'et al. continued'
    const dotPos = text.indexOf('.')
    expect(isValidBreak(text, dotPos)).toBe(false)
  })

  it('正常英文句号后跟空格是有效分割', () => {
    expect(isValidBreak('End. Start', 3)).toBe(true)
  })

  it('连续 !! 或 ?? 不分割', () => {
    expect(isValidBreak('What?!', 4)).toBe(false) // ! 后跟 ?
    expect(isValidBreak('Really!!', 6)).toBe(false) // ! 后跟 !
  })

  it('单字母缩写（如 A.）不分割', () => {
    expect(isValidBreak('A. B', 1)).toBe(false)
  })
})

// ─── ABBREVIATIONS ─────────────────────────────────────────

describe('ABBREVIATIONS', () => {
  it('包含常见缩写', () => {
    expect(ABBREVIATIONS.has('dr')).toBe(true)
    expect(ABBREVIATIONS.has('etc')).toBe(true)
    expect(ABBREVIATIONS.has('al')).toBe(true)
    expect(ABBREVIATIONS.has('fig')).toBe(true)
  })
})

// ─── splitSentences ────────────────────────────────────────

describe('splitSentences', () => {
  it('空文本返回空数组', () => {
    expect(splitSentences('')).toEqual([])
    expect(splitSentences(null)).toEqual([])
    expect(splitSentences(undefined)).toEqual([])
  })

  it('短文本（<50字符）不分割', () => {
    const short = 'This is a short text.'
    expect(splitSentences(short)).toEqual([short])
  })

  it('按英文句号分割', () => {
    const text = 'First sentence. Second sentence. Third sentence. And more text to make it long enough for splitting to happen.'
    const result = splitSentences(text)
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0]).toContain('First sentence.')
  })

  it('按中文句号分割', () => {
    const text = '这是第一句话，包含了很多内容并且还需要更长才能超过五十字符的限制。这是第二句话，同样也很长需要足够多的字符。这是第三句话，结尾了。'
    const result = splitSentences(text)
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('不在小数中间分割', () => {
    const text = 'The value is 3.14 and the result is 2.718 and more text here to make it long enough for splitting.'
    const result = splitSentences(text)
    // 3.14 和 2.718 不应被分割
    const joined = result.join('')
    expect(joined).toContain('3.14')
    expect(joined).toContain('2.718')
  })

  it('跳过占位符区域', () => {
    const text = 'Before sentence. \x00ATOM_0\x00 After sentence. More text to make it long enough.'
    const result = splitSentences(text)
    // 占位符应完整保留
    const hasPlaceholder = result.some(s => s.includes('\x00ATOM_0\x00'))
    expect(hasPlaceholder).toBe(true)
  })

  it('无有效分割点返回原文', () => {
    const text = 'no break points here at all just continuous text without any punctuation marks'
    const result = splitSentences(text)
    expect(result).toEqual([text])
  })
})
