export interface Product {
  id: number;
  name: string;
  nameEN: string;
  nameJP: string;
  image: string;
  price: number;
  originalPrice: number;
  available: boolean;
}

export const products: Product[] = [
  {
    id: 1,
    name: 'SUPERSELF-T BLANCO/AZUL',
    nameEN: 'SUPERSELF-T WHITE/BLUE',
    nameJP: 'SUPERSELF-T 白/青',
    image: '/ss-blanco-azul.png',
    price: 50,
    originalPrice: 70,
    available: true,
  },
  {
    id: 2,
    name: 'SUPERSELF-T BLANCO/NEGRO',
    nameEN: 'SUPERSELF-T WHITE/BLACK',
    nameJP: 'SUPERSELF-T 白/黒',
    image: '/ss-blanco-negro.png',
    price: 50,
    originalPrice: 70,
    available: true,
  },
  {
    id: 3,
    name: 'SUPERSELF-T NEGRO/BLANCO',
    nameEN: 'SUPERSELF-T BLACK/WHITE',
    nameJP: 'SUPERSELF-T 黒/白',
    image: '/ss-negro-blanco.png',
    price: 50,
    originalPrice: 70,
    available: true,
  },
  {
    id: 4,
    name: 'SUPERSELF-T NEGRO/ROJO',
    nameEN: 'SUPERSELF-T BLACK/RED',
    nameJP: 'SUPERSELF-T 黒/赤',
    image: '/ss-negro-rojo.png',
    price: 50,
    originalPrice: 70,
    available: true,
  },
];

// Shop translations
export const shopTranslations = {
  ES: {
    shopTitle: 'tienda.exe',
    buy: 'comprar',
    moreSoon: 'más en camino',
    whatsappButton: 'Pedir por WhatsApp',
    currency: 'S/.',
    selectSize: 'Talla',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  EN: {
    shopTitle: 'shop.exe',
    buy: 'buy',
    moreSoon: 'stay tuned',
    whatsappButton: 'Order via WhatsApp',
    currency: 'S/.',
    selectSize: 'Size',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  JP: {
    shopTitle: '店舗.exe',
    buy: '購入',
    moreSoon: '近日追加',
    whatsappButton: 'WhatsAppで注文',
    currency: 'S/.',
    selectSize: 'サイズ',
    sizes: ['S', 'M', 'L', 'XL'],
  },
} as const;

export type Language = 'ES' | 'EN' | 'JP';

export function getProductName(product: Product, language: Language): string {
  switch (language) {
    case 'EN':
      return product.nameEN;
    case 'JP':
      return product.nameJP;
    default:
      return product.name;
  }
}

export function getWhatsAppLink(product: Product, language: Language, size?: string): string {
  const phone = '51990028077';
  const productName = getProductName(product, language);
  const sizeText = size ? ` - Talla: ${size}` : '';
  const sizeTextEN = size ? ` - Size: ${size}` : '';
  const sizeTextJP = size ? ` - サイズ: ${size}` : '';

  const messages = {
    ES: `Hola! Me interesa comprar el polo ${productName}${sizeText}`,
    EN: `Hi! I'm interested in buying the ${productName} polo${sizeTextEN}`,
    JP: `こんにちは！${productName}のポロシャツを購入したいです${sizeTextJP}`,
  };

  const message = encodeURIComponent(messages[language]);
  return `https://wa.me/${phone}?text=${message}`;
}
