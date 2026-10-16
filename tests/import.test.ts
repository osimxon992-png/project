import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseProductsFile } from '@/lib/import'

const csv = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer

describe('parseProductsFile', () => {
  it('parses a valid CSV', () => {
    const r = parseProductsFile(
      csv('nomi,narxi,kategoriya,variantlar,tavsif\nFutbolka,"120 000",Kiyim,"S, M, L",Paxta\nKepka,50000,,,\n'),
      'p.csv',
    )
    expect(r.errors).toEqual([])
    expect(r.products).toEqual([
      { name: 'Futbolka', price: 120000, category: 'Kiyim', variants: ['S', 'M', 'L'], description: 'Paxta' },
      { name: 'Kepka', price: 50000, category: '', variants: [], description: '' },
    ])
  })

  it('handles UTF-8 BOM, Cyrillic and empty rows', () => {
    const r = parseProductsFile(csv(String.fromCharCode(0xfeff) + 'nomi,narxi\nКофта,99000\n,,\n'), 'p.csv')
    expect(r.products).toEqual([{ name: 'Кофта', price: 99000, category: '', variants: [], description: '' }])
  })

  it('reports empty name and invalid price, imports nothing', () => {
    const r = parseProductsFile(csv('nomi,narxi\n,1000\nKepka,abc\nShim,12.5\nYaxshi,100\n'), 'p.csv')
    expect(r.products).toEqual([])
    expect(r.errors).toEqual([
      "2-qator: nomi bo'sh",
      '3-qator: narx noto\'g\'ri ("abc")',
      '4-qator: narx noto\'g\'ri ("12.5")',
    ])
  })

  it('requires nomi and narxi columns', () => {
    expect(parseProductsFile(csv('title,cost\nA,1\n'), 'p.csv').errors[0]).toMatch(/ustunlari/)
  })

  it('parses an .xlsx file', () => {
    const ws = XLSX.utils.aoa_to_sheet([['Nomi', 'Narxi', 'Variantlar'], ['Ko\'ylak', 150000, 'Qizil;Ko\'k']])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    expect(parseProductsFile(buf, 'p.xlsx').products).toEqual([
      { name: "Ko'ylak", price: 150000, category: '', variants: ['Qizil', "Ko'k"], description: '' },
    ])
  })
})
