import { Language } from './types';

export type TranslationKeys = {
  welcome: string;
  willYouContinue: string;
  yes: string;
  no: string;
  shuttingDown: string;
  about: string;
  shop: string;
  welcomeTitle: string;
  welcomeMessage: string;
  ok: string;
  aboutTitle: string;
  aboutText: string;
  close: string;
  shopTitle: string;
  shopMessage: string;
  copyright: string;
  message: string;
  emailCopied: string;
  invalidEmail: string;
  subscribe: string;
  subscribePrompt: string;
  emailPlaceholder: string;
  subscribed: string;
  subscribedMessage: string;
  confirm: string;
  cancel: string;
  mixes: string;
  mixesTitle: string;
  skip: string;
  warningTitle: string;
  warningMessage: string;
  errorTitle: string;
  errorException: string;
  errorTerminated: string;
  errorPressKey: string;
};

export const translations: Record<Language, TranslationKeys> = {
  ES: {
    welcome: 'BIENVENIDO/A.',
    willYouContinue: 'DESEA CONTINUAR AL SITIO?',
    yes: 'SI',
    no: 'NO',
    shuttingDown: 'apagando',
    about: '> acerca',
    shop: '> tienda',
    welcomeTitle: 'superself.exe',
    welcomeMessage: 'Se encontro una invitacion pendiente.',
    ok: 'Abrir',
    aboutTitle: 'acerca.txt',
    aboutText: '(2023) es un colectivo y sello de música electrónica nacido en Lima, Perú. El proyecto comenzó con una idea clara: compartir lo que realmente nos gusta y sentimos cercano. En este espacio publicamos mezclas, lanzamientos propios y una selección de música que nos representa. Déjanos tu mail para recibir novedades.',
    close: 'Cerrar',
    shopTitle: 'tienda.exe',
    shopMessage: 'Tienda proximamente...',
    copyright: '{ superself • 2026 }',
    message: '1 mensaje nuevo',
    emailCopied: 'email copiado',
    invalidEmail: 'ingresa un email valido',
    subscribe: 'suscribirse',
    subscribePrompt: 'Ingresa tu e-mail para unirte. :)',
    emailPlaceholder: 'tu@email.com',
    subscribed: '¡suscrito!',
    subscribedMessage: 'Gracias por suscribirte',
    confirm: 'Enviar',
    cancel: 'Cancelar',
    mixes: '> sesiones',
    mixesTitle: 'sesiones.exe',
    skip: 'saltar',
    warningTitle: 'Mensaje del sistema',
    warningMessage: 'El tamano de pantalla puede afectar la experiencia.\nGira el dispositivo o redimensiona la ventana.',
    errorTitle: 'ERROR',
    errorException: 'Ha ocurrido una excepcion fatal 0E en',
    errorTerminated: 'La aplicacion actual sera terminada.',
    errorPressKey: 'Presiona cualquier tecla para continuar',
  },
  EN: {
    welcome: 'WELCOME.',
    willYouContinue: 'WILL YOU CONTINUE?',
    yes: 'YES',
    no: 'NO',
    shuttingDown: 'shutting down',
    about: '> about',
    shop: '> shop',
    welcomeTitle: 'superself.exe',
    welcomeMessage: 'Pending invitation found.',
    ok: 'Open',
    aboutTitle: 'about.txt',
    aboutText: '(2023) is an electronic music collective and label born in Lima, Peru. The project started with a clear idea: sharing what we truly enjoy and feel close to. Here we publish mixes, original releases and a selection of music that represents us. Leave your email to get updates.',
    close: 'Close',
    shopTitle: 'shop.exe',
    shopMessage: 'Shop coming soon...',
    copyright: '{ superself • 2026 }',
    message: '1 new message',
    emailCopied: 'email copied',
    invalidEmail: 'enter a valid email',
    subscribe: 'subscribe',
    subscribePrompt: 'Enter your e-mail to join. :)',
    emailPlaceholder: 'your@email.com',
    subscribed: 'subscribed!',
    subscribedMessage: 'Thanks for subscribing',
    confirm: 'Send',
    cancel: 'Cancel',
    mixes: '> mixes',
    mixesTitle: 'mixes.exe',
    skip: 'skip',
    warningTitle: 'System message',
    warningMessage: 'Screen size may affect the experience.\nRotate device or resize window.',
    errorTitle: 'ERROR',
    errorException: 'A fatal exception 0E has occurred at',
    errorTerminated: 'The current application will be terminated.',
    errorPressKey: 'Press any key to continue',
  },
  JP: {
    welcome: 'ようこそ',
    willYouContinue: '続行しますか？',
    yes: 'はい',
    no: 'いいえ',
    shuttingDown: 'シャットダウン',
    about: '> 概要',
    shop: '> 店舗',
    welcomeTitle: 'superself.exe',
    welcomeMessage: '保留中の招待があります。',
    ok: '開く',
    aboutTitle: '概要.txt',
    aboutText: '(2023) はリマ、ペルー発の電子音楽コレクティブ＆レーベル。本当に好きで、近いと感じるものを共有するという明確なアイデアから始まった。ここではミックス、自主リリース、そして自分たちを表す音楽のセレクションを発信中。メールを残して最新情報を受け取ろう。',
    close: '閉じる',
    shopTitle: '店舗.exe',
    shopMessage: 'ショップは近日公開...',
    copyright: '{ superself • 2026 }',
    message: '1件の新着',
    emailCopied: 'コピーしました',
    invalidEmail: '有効なメールを入力',
    subscribe: '登録',
    subscribePrompt: 'メールを入力して参加。:)',
    emailPlaceholder: 'メール@例.com',
    subscribed: '登録完了!',
    subscribedMessage: '登録ありがとう',
    confirm: '送信',
    cancel: 'キャンセル',
    mixes: '> セッション',
    mixesTitle: 'セッション.exe',
    skip: 'スキップ',
    warningTitle: 'システムメッセージ',
    warningMessage: '画面サイズが体験に影響する可能性があります。\nデバイスを回転またはリサイズ。',
    errorTitle: 'エラー',
    errorException: '致命的な例外 0E が発生しました',
    errorTerminated: '現在のアプリケーションは終了します。',
    errorPressKey: '続行するには何かキーを押してください',
  },
};

// Helper to get dot character based on language
export const getDotChar = (language: Language): string => {
  return language === 'JP' ? '・' : '.';
};
