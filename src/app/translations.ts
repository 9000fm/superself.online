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
  aboutHeader: string;
  aboutBio: string;
  aboutCta: string;
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
  shoutbox: {
    title: string;
    onAir: string;
    offline: string;
    connecting: string;
    empty: string;
    nicknamePlaceholder: string;
    bodyPlaceholder: string;
    send: string;
    sendShort: string;
    rateLimited: string;
    rateLimitedDaily: string;
    rejected: string;
    open: string;
    messages: string;
    badgeOne: string;
    badgeMany: string;
  };
  msgHeader: string;
  msgFrom: string;
  msgTo: string;
  msgStatus: string;
  msgVisitor: string;
  msgOnline: string;
  msgOffline: string;
  chatComingSoon: string;
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
    aboutHeader: 'sobre superself',
    aboutBio: '(2023) es un colectivo y sello de música electrónica nacido en Lima, Perú. Surge como un espacio para compartir sonidos que realmente nos mueven. Aquí publicamos mezclas, lanzamientos propios y música que nos representa.',
    aboutCta: 'Déjanos tu mail para recibir novedades.',
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
    mixesTitle: 'sesiones.m3u',
    skip: 'saltar',
    warningTitle: 'Mensaje del sistema',
    warningMessage: 'El tamano de pantalla puede afectar la experiencia.\nGira el dispositivo o redimensiona la ventana.',
    errorTitle: 'ERROR',
    errorException: 'Ha ocurrido una excepcion fatal 0E en',
    errorTerminated: 'La aplicacion actual sera terminada.',
    errorPressKey: 'Presiona cualquier tecla para continuar',
    shoutbox: {
      title: '#chat',
      onAir: 'en linea',
      offline: 'sin señal',
      connecting: 'conectando',
      empty: '>> silencio total. sé el primero en transmitir.',
      nicknamePlaceholder: 'alias (opcional)',
      bodyPlaceholder: 'escribe un mensaje',
      send: 'enviar',
      sendShort: '→',
      rateLimited: 'espera {n}s',
      rateLimitedDaily: 'limite diario alcanzado. vuelve mañana.',
      rejected: 'mensaje rechazado',
      open: 'abrir chat ({n} mensajes)',
      messages: 'mensajes',
      badgeOne: '1 mensaje nuevo',
      badgeMany: '{n} mensajes nuevos',
    },
    msgHeader: 'MENSAJE',
    msgFrom: 'DE',
    msgTo: 'PARA',
    msgStatus: 'ESTADO',
    msgVisitor: 'visitante',
    msgOnline: 'en linea',
    msgOffline: 'fuera de linea',
    chatComingSoon: 'chat proximamente...',
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
    aboutHeader: 'about superself',
    aboutBio: '(2023) is an electronic music collective and label born in Lima, Peru. It emerged as a space to share sounds that truly move us. Here we publish mixes, original releases and music that represents us.',
    aboutCta: 'Leave your email to get updates.',
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
    shoutbox: {
      title: '#chat',
      onAir: 'online',
      offline: 'no signal',
      connecting: 'connecting',
      empty: '>> dead air. be the first to transmit.',
      nicknamePlaceholder: 'alias (optional)',
      bodyPlaceholder: 'type a message',
      send: 'send',
      sendShort: '→',
      rateLimited: 'wait {n}s',
      rateLimitedDaily: 'daily limit reached. come back tomorrow.',
      rejected: 'message rejected',
      open: 'open chat ({n} messages)',
      messages: 'messages',
      badgeOne: '1 new message',
      badgeMany: '{n} new messages',
    },
    msgHeader: 'MESSAGE',
    msgFrom: 'FROM',
    msgTo: 'TO',
    msgStatus: 'STATUS',
    msgVisitor: 'visitor',
    msgOnline: 'online',
    msgOffline: 'offline',
    chatComingSoon: 'chat coming soon...',
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
    aboutHeader: 'superselfについて',
    aboutBio: '(2023) はリマ、ペルー発の電子音楽コレクティブ＆レーベル。本当に心を動かすサウンドを共有する場として生まれた。ここではミックス、自主リリース、そして自分たちを表す音楽を発信中。',
    aboutCta: 'メールを残して最新情報を受け取ろう。',
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
    shoutbox: {
      title: '#chat',
      onAir: 'オンライン',
      offline: '接続なし',
      connecting: '接続中',
      empty: '>> 沈黙。最初の信号を送ろう。',
      nicknamePlaceholder: 'ニックネーム (任意)',
      bodyPlaceholder: 'メッセージを入力',
      send: '送信',
      sendShort: '→',
      rateLimited: '{n}秒待って',
      rateLimitedDaily: '1日の上限に達しました。明日また。',
      rejected: 'メッセージが拒否されました',
      open: 'チャットを開く ({n}件)',
      messages: '件',
      badgeOne: '1件の新着',
      badgeMany: '{n}件の新着',
    },
    msgHeader: 'メッセージ',
    msgFrom: '送信者',
    msgTo: '宛先',
    msgStatus: '状態',
    msgVisitor: '訪問者',
    msgOnline: 'オンライン',
    msgOffline: 'オフライン',
    chatComingSoon: 'チャット近日公開...',
  },
};

// Helper to get dot character based on language
export const getDotChar = (language: Language): string => {
  return language === 'JP' ? '・' : '.';
};
