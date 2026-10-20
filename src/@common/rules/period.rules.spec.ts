import { describe, expect, it } from 'vitest'

import { periodsOverlap } from './period.rules'

describe('periodsOverlap', () => {
  // período de referência: 10:00 às 10:30, em minutos desde a meia-noite
  const referenceStart = 600
  const referenceEnd = 630

  it('não conflita quando um período termina antes do outro começar', () => {
    expect(periodsOverlap(referenceStart, referenceEnd, 540, 570)).toBe(false)
  })

  it('não conflita quando um período começa depois do fim do outro', () => {
    expect(periodsOverlap(referenceStart, referenceEnd, 660, 690)).toBe(false)
  })

  it('não conflita quando os períodos apenas se encostam', () => {
    expect(periodsOverlap(referenceStart, referenceEnd, 630, 660)).toBe(false)
    expect(periodsOverlap(referenceStart, referenceEnd, 570, 600)).toBe(false)
  })

  it('conflita quando um período está dentro do outro', () => {
    expect(periodsOverlap(540, 720, referenceStart, referenceEnd)).toBe(true)
    expect(periodsOverlap(referenceStart, referenceEnd, 540, 720)).toBe(true)
  })

  it('conflita quando cruza a borda, mesmo com inícios diferentes', () => {
    // 10:00-10:30 e 10:20-10:50
    expect(periodsOverlap(referenceStart, referenceEnd, 620, 650)).toBe(true)
    expect(periodsOverlap(620, 650, referenceStart, referenceEnd)).toBe(true)
  })

  it('conflita quando os períodos são idênticos', () => {
    expect(
      periodsOverlap(referenceStart, referenceEnd, referenceStart, referenceEnd)
    ).toBe(true)
  })
})
