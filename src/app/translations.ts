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
  allRightsReserved: string;
  emailCopied: string;
  invalidEmail: string;
  subscribe: string;
  subscribePrompt: string;
  emailPlaceholder: string;
  subscribed: string;
  subscribedMessage: string;
  confirm: string;
  cancel: string;
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
    aboutText: '(2023) es un sello y colectivo de musica electronica. Compartimos mixes, recomendaciones selectas y musica original. Nos mueve apoyar proyectos con identidad, acercar artistas a oyentes reales y fomentar una cultura de colaboracion. Sonido primero. Poco floro. Energia real.',
    close: 'Cerrar',
    shopTitle: 'tienda.exe',
    shopMessage: 'Tienda proximamente...',
    copyright: '{ superself • 2026 }',
    message: '1 mensaje nuevo',
    allRightsReserved: 'todos los derechos reservados',
    emailCopied: 'email copiado',
    invalidEmail: 'ingresa un email valido',
    subscribe: 'suscribirse',
    subscribePrompt: 'Ingresa tu e-mail para unirte. :)',
    emailPlaceholder: 'tu@email.com',
    subscribed: '¡suscrito!',
    subscribedMessage: 'Gracias por suscribirte',
    confirm: 'Enviar',
    cancel: 'Cancelar',
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
    aboutText: '(2023) is an electronic music label and collective. We share mixes, curated recommendations and original music. We support projects with identity, bring artists closer to real listeners and foster a culture of collaboration. Sound first. Less talk. Real energy.',
    close: 'Close',
    shopTitle: 'shop.exe',
    shopMessage: 'Shop coming soon...',
    copyright: '{ superself • 2026 }',
    message: '1 new message',
    allRightsReserved: 'all rights reserved',
    emailCopied: 'email copied',
    invalidEmail: 'enter a valid email',
    subscribe: 'subscribe',
    subscribePrompt: 'Enter your e-mail to join. :)',
    emailPlaceholder: 'your@email.com',
    subscribed: 'subscribed!',
    subscribedMessage: 'Thanks for subscribing',
    confirm: 'Send',
    cancel: 'Cancel',
    skip: 'skip',
    warningTitle: 'System message',
    warningMessage: 'Screen size may affect the experience.\nRotate device or resize window.',
    errorTitle: 'ERROR',
    errorException: 'A fatal exception 0E has occurred at',
    errorTerminated: 'The current application will be terminated.',
    errorPressKey: 'Press any key to continue',
  },
  JP: {
    welcome: 'ようこそ。',
    willYouContinue: '続行しますか?',
    yes: 'はい',
    no: 'いいえ',
    shuttingDown: 'シャットダウン',
    about: '> 概要',
    shop: '> 店舗',
    welcomeTitle: 'superself.exe',
    welcomeMessage: '保留中の招待があります。',
    ok: '開く',
    aboutTitle: '概要.txt',
    aboutText: '(2023) は電子音楽レーベル＆コレクティブ。ミックス、厳選レコメンド、オリジナル音楽を共有。個性あるプロジェクトを支援し、アーティストと本物のリスナーを繋ぎ、コラボ文化を育む。サウンド優先。余計な言葉なし。リアルなエネルギー。',
    close: '閉じる',
    shopTitle: '店舗.exe',
    shopMessage: 'ショップは近日公開...',
    copyright: '{ superself • 2026 }',
    message: '1件の新着',
    allRightsReserved: '全著作権所有',
    emailCopied: 'コピーしました',
    invalidEmail: '有効なメールを入力',
    subscribe: '登録',
    subscribePrompt: 'メールを入力して参加。:)',
    emailPlaceholder: 'メール@例.com',
    subscribed: '登録完了!',
    subscribedMessage: '登録ありがとう',
    confirm: '送信',
    cancel: 'キャンセル',
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
