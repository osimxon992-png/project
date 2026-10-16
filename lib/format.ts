export const sum = (n: number, unit = "so'm") => `${n.toLocaleString('ru-RU').replace(/\s/g, ' ')} ${unit}`

export const day = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { timeZone: 'Asia/Tashkent' })

export const STATUS_LABEL = {
  new: 'Yangi',
  confirmed: 'Tasdiqlangan',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
} as const
