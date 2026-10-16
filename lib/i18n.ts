import { cookies } from 'next/headers'

// Storefront interface only; product texts are shown as the seller wrote them.
const uz = {
  products: 'Mahsulotlar',
  other: 'Boshqa',
  noProducts: "Hozircha mahsulotlar yo'q",
  outOfStock: 'Mavjud emas',
  addToCart: "Savatga qo'shish",
  added: "Savatga qo'shildi",
  goToCart: "Savatga o'tish →",
  variant: 'Variant',
  qty: 'Soni',
  cart: 'Savat',
  emptyCart: "Savat bo'sh",
  remove: "O'chirish",
  total: 'Jami',
  checkout: 'Buyurtma berish',
  name: 'Ismingiz',
  phone: 'Telefon',
  phoneHint: '+998 XX XXX XX XX',
  address: 'Manzil',
  comment: 'Izoh',
  sending: 'Yuborilmoqda…',
  orderReceived: 'Buyurtmangiz qabul qilindi',
  orderNo: 'Buyurtma raqami',
  orderNote: "Sotuvchi tez orada siz bilan bog'lanadi.",
  status: 'Holat',
  st_new: 'Yangi',
  st_confirmed: 'Tasdiqlangan',
  st_delivered: 'Yetkazildi',
  st_cancelled: 'Bekor qilindi',
  contacts: 'Aloqa',
  delivery: 'Yetkazib berish',
  payment: "To'lov usullari",
  closed: "Do'kon vaqtincha yopiq",
  closedNote: "Iltimos, keyinroq qayta kiring.",
  madeWith: "Sahifa'da yaratilgan",
  back: '← Orqaga',
  sum: "so'm",
}

const ru: typeof uz = {
  products: 'Товары',
  other: 'Другое',
  noProducts: 'Пока нет товаров',
  outOfStock: 'Нет в наличии',
  addToCart: 'В корзину',
  added: 'Добавлено в корзину',
  goToCart: 'Перейти в корзину →',
  variant: 'Вариант',
  qty: 'Кол-во',
  cart: 'Корзина',
  emptyCart: 'Корзина пуста',
  remove: 'Удалить',
  total: 'Итого',
  checkout: 'Оформить заказ',
  name: 'Ваше имя',
  phone: 'Телефон',
  phoneHint: '+998 XX XXX XX XX',
  address: 'Адрес',
  comment: 'Комментарий',
  sending: 'Отправка…',
  orderReceived: 'Ваш заказ принят',
  orderNo: 'Номер заказа',
  orderNote: 'Продавец скоро свяжется с вами.',
  status: 'Статус',
  st_new: 'Новый',
  st_confirmed: 'Подтверждён',
  st_delivered: 'Доставлен',
  st_cancelled: 'Отменён',
  contacts: 'Контакты',
  delivery: 'Доставка',
  payment: 'Способы оплаты',
  closed: 'Магазин временно закрыт',
  closedNote: 'Пожалуйста, зайдите позже.',
  madeWith: 'Создано в Sahifa',
  back: '← Назад',
  sum: 'сум',
}

export type Dict = typeof uz
export type Lang = 'uz' | 'ru'

export async function getLang(): Promise<Lang> {
  return (await cookies()).get('lang')?.value === 'ru' ? 'ru' : 'uz'
}

export async function getDict() {
  const lang = await getLang()
  return { lang, t: lang === 'ru' ? ru : uz }
}
