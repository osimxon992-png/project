import Anthropic from '@anthropic-ai/sdk'

const SYSTEM = `Siz O'zbekistondagi Instagram/Telegram do'konlari uchun qisqa sotuv matnlarini yozasiz.
Berilgan mahsulot uchun 2–3 gapdan iborat jozibali tavsif yozing:
- "uz": o'zbek tilida, lotin yozuvida;
- "ru": rus tilida, xuddi shu mazmunda.
Faqat nom va izohdagi ma'lumotga tayaning, o'lcham, material yoki narx kabi faktlarni o'ylab topmang. Xeshteg ishlatmang.`

export async function writeDescription(name: string, hint: string) {
  const res = await new Anthropic().messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
    max_tokens: 2048,
    system: SYSTEM,
    output_config: {
      effort: 'low',
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: { uz: { type: 'string' }, ru: { type: 'string' } },
          required: ['uz', 'ru'],
          additionalProperties: false,
        },
      },
    },
    messages: [{ role: 'user', content: `Mahsulot: ${name}\nIzoh: ${hint || '—'}` }],
  })
  if (res.stop_reason === 'refusal') throw new Error('refusal')
  const text = res.content.find((b) => b.type === 'text')?.text
  const { uz, ru } = JSON.parse(text ?? '{}') as { uz?: string; ru?: string }
  if (!uz || !ru) throw new Error('empty AI response')
  return `${uz.trim()}\n\n${ru.trim()}`
}
