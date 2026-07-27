import { useState, useCallback, useEffect } from 'react';

export const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English', flag: 'https://flagcdn.com/w40/us.png' },
  { code: 'vi', label: 'VI', name: 'Tiếng Việt', flag: 'https://flagcdn.com/w40/vn.png' },
  { code: 'zh', label: '中文', name: '中文', flag: 'https://flagcdn.com/w40/cn.png' },
  { code: 'ja', label: '日本', name: '日本語', flag: 'https://flagcdn.com/w40/jp.png' },
  { code: 'ko', label: '한국', name: '한국어', flag: 'https://flagcdn.com/w40/kr.png' },
  { code: 'th', label: 'TH', name: 'ภาษาไทย', flag: 'https://flagcdn.com/w40/th.png' },
  { code: 'id', label: 'ID', name: 'Bahasa Indonesia', flag: 'https://flagcdn.com/w40/id.png' },
  { code: 'es', label: 'ES', name: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'fr', label: 'FR', name: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'pt', label: 'PT', name: 'Português', flag: 'https://flagcdn.com/w40/br.png' },
  { code: 'ar', label: 'AR', name: 'العربية', flag: 'https://flagcdn.com/w40/sa.png' },
  { code: 'hi', label: 'HI', name: 'हिन्दी', flag: 'https://flagcdn.com/w40/in.png' },
  { code: 'de', label: 'DE', name: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
  { code: 'ru', label: 'RU', name: 'Русский', flag: 'https://flagcdn.com/w40/ru.png' },
  { code: 'ms', label: 'MS', name: 'Bahasa Melayu', flag: 'https://flagcdn.com/w40/my.png' },
] as const;

export type LangCode = (typeof LANGUAGES)[number]['code'];

// Translation keys
const T: Record<string, string> = {
  // Navbar
  'nav.menu': 'Menu', 'nav.orders': 'Orders', 'nav.track': 'Track', 'nav.feedback': 'Feedback',
  'nav.admin': 'Admin', 'nav.cart': 'Cart',
  // Shop
  'shop.addToCart': 'Add to Cart', 'shop.viewCart': 'View Cart', 'shop.checkout': 'Checkout',
  'shop.total': 'Total', 'shop.emptyCart': 'Your cart is empty', 'shop.browseMenu': 'Browse our menu to add items',
  'shop.orderPlaced': 'Order Placed!', 'shop.orderConfirmed': 'Your order has been confirmed',
  'shop.subtotal': 'Subtotal', 'shop.shipping': 'Shipping', 'shop.free': 'FREE',
  'shop.outOfStock': 'Out of Stock', 'shop.lowStock': 'Only {n} left',
  'shop.promoCode': 'Promo Code', 'shop.apply': 'Apply', 'shop.remove': 'Remove',
  // Footer
  'footer.shop': 'Shop', 'footer.payment': 'Payment', 'footer.resources': 'Resources',
  'footer.menu': 'Menu', 'footer.myOrders': 'My Orders', 'footer.trackOrder': 'Track Order',
  'footer.copyright': '© 2026 The Daily Cup. All rights reserved. Built on Ritual.',
  // Share
  'share.title': 'Share', 'share.facebook': 'Facebook', 'share.zalo': 'Zalo',
  'share.twitter': 'Twitter / X', 'share.copyLink': 'Copy Link', 'share.copied': 'Link copied!',
  // General
  'general.connectWallet': 'Connect Wallet', 'general.disconnect': 'Disconnect',
  'general.cancel': 'Cancel', 'general.confirm': 'Confirm', 'general.loading': 'Loading...',
  'general.error': 'Error', 'general.success': 'Success', 'general.save': 'Save',
  // Banner
  'banner.official': 'Official e-commerce site · ', 'banner.payWith': 'Pay with RITUAL on Ritual',
  // Delivery
  'delivery.title': 'Delivery', 'delivery.address': 'Delivery Address',
  'delivery.estimatedTime': 'Estimated Time', 'delivery.free': 'Free',
  // Feedback
  'feedback.title': 'Customer Feedback', 'feedback.subtitle': 'Share your experience and help us improve our products',
  'feedback.write': 'Write Feedback', 'feedback.selectProduct': 'Select Product', 'feedback.rating': 'Your Rating',
  'feedback.comment': 'Your Feedback', 'feedback.submit': 'Submit Feedback', 'feedback.allProducts': 'All Products',
};

type Translations = Record<LangCode, Record<string, string>>;

const translations: Translations = {
  en: { ...T },
  vi: {
    'nav.menu': 'Thực Đơn', 'nav.orders': 'Đơn Hàng', 'nav.track': 'Theo Dõi', 'nav.feedback': 'Đánh Giá',
    'nav.admin': 'Quản Trị', 'nav.cart': 'Giỏ Hàng',
    'shop.addToCart': 'Thêm Vào Giỏ', 'shop.viewCart': 'Xem Giỏ Hàng', 'shop.checkout': 'Thanh Toán',
    'shop.total': 'Tổng Cộng', 'shop.emptyCart': 'Giỏ hàng trống', 'shop.browseMenu': 'Duyệt thực đơn để thêm món',
    'shop.orderPlaced': 'Đã Đặt Hàng!', 'shop.orderConfirmed': 'Đơn hàng đã được xác nhận',
    'shop.subtotal': 'Tạm tính', 'shop.shipping': 'Phí ship', 'shop.free': 'MIỄN PHÍ',
    'shop.outOfStock': 'Hết hàng', 'shop.lowStock': 'Chỉ còn {n}',
    'shop.promoCode': 'Mã giảm giá', 'shop.apply': 'Áp dụng', 'shop.remove': 'Xóa',
    'footer.shop': 'Cửa Hàng', 'footer.payment': 'Thanh Toán', 'footer.resources': 'Tài Nguyên',
    'footer.menu': 'Thực Đơn', 'footer.myOrders': 'Đơn Hàng Của Tôi', 'footer.trackOrder': 'Theo Dõi Đơn',
    'footer.copyright': '© 2026 The Daily Cup. Mọi quyền được bảo lưu.',
    'share.title': 'Chia sẻ', 'share.facebook': 'Facebook', 'share.zalo': 'Zalo',
    'share.twitter': 'Twitter / X', 'share.copyLink': 'Sao chép liên kết', 'share.copied': 'Đã sao chép!',
    'general.connectWallet': 'Kết Nối Ví', 'general.disconnect': 'Ngắt Kết Nối',
    'general.cancel': 'Hủy', 'general.confirm': 'Xác Nhận', 'general.loading': 'Đang tải...',
    'general.error': 'Lỗi', 'general.success': 'Thành Công', 'general.save': 'Lưu',
    'banner.official': 'Trang thương mại điện tử chính thức · ', 'banner.payWith': 'Thanh toán bằng RITUAL trên Ritual',
    'delivery.title': 'Giao Hàng', 'delivery.address': 'Địa Chỉ Giao Hàng',
    'delivery.estimatedTime': 'Thời Gian Dự Kiến', 'delivery.free': 'Miễn phí',
    'feedback.title': 'Đánh Giá Khách Hàng', 'feedback.subtitle': 'Chia sẻ trải nghiệm của bạn để giúp chúng tôi cải thiện',
    'feedback.write': 'Viết Đánh Giá', 'feedback.selectProduct': 'Chọn Sản Phẩm', 'feedback.rating': 'Đánh Giá Của Bạn',
    'feedback.comment': 'Nhận Xét', 'feedback.submit': 'Gửi Đánh Giá', 'feedback.allProducts': 'Tất Cả Sản Phẩm',
  },
  zh: {
    'nav.menu': '菜单', 'nav.orders': '订单', 'nav.track': '追踪', 'nav.feedback': '评价',
    'nav.admin': '管理', 'nav.cart': '购物车',
    'shop.addToCart': '加入购物车', 'shop.checkout': '结账', 'shop.total': '合计',
    'shop.emptyCart': '购物车为空', 'shop.browseMenu': '浏览菜单添加商品',
    'shop.orderPlaced': '已下单！', 'shop.orderConfirmed': '订单已确认',
    'shop.subtotal': '小计', 'shop.shipping': '运费', 'shop.free': '免运费',
    'shop.outOfStock': '缺货', 'shop.promoCode': '优惠码', 'shop.apply': '应用',
    'banner.official': '官方电商网站 · ', 'banner.payWith': '使用 RITUAL 在 Ritual 测试网支付',
    'general.connectWallet': '连接钱包', 'general.loading': '加载中...',
    'feedback.title': '客户评价', 'feedback.write': '写评价', 'feedback.submit': '提交评价',
    'footer.copyright': '© 2026 The Daily Cup. 保留所有权利。',
  },
  ja: {
    'nav.menu': 'メニュー', 'nav.orders': '注文', 'nav.track': '追跡', 'nav.feedback': 'レビュー',
    'nav.admin': '管理', 'nav.cart': 'カート',
    'shop.addToCart': 'カートに追加', 'shop.checkout': 'お会計', 'shop.total': '合計',
    'shop.emptyCart': 'カートは空です', 'shop.browseMenu': 'メニューを見る',
    'shop.orderPlaced': '注文完了！', 'shop.orderConfirmed': '注文が確認されました',
    'shop.subtotal': '小計', 'shop.shipping': '配送料', 'shop.free': '送料無料',
    'shop.outOfStock': '在庫切れ', 'shop.promoCode': 'プロモコード', 'shop.apply': '適用',
    'banner.official': '公式ECサイト · ', 'banner.payWith': 'RitualテストネットでRITUAL決済',
    'general.connectWallet': 'ウォレット接続', 'general.loading': '読み込み中...',
    'feedback.title': 'お客様の声', 'feedback.write': 'レビューを書く', 'feedback.submit': '送信',
    'footer.copyright': '© 2026 The Daily Cup. All rights reserved.',
  },
  ko: {
    'nav.menu': '메뉴', 'nav.orders': '주문', 'nav.track': '추적', 'nav.feedback': '리뷰',
    'nav.admin': '관리', 'nav.cart': '장바구니',
    'shop.addToCart': '장바구니 추가', 'shop.checkout': '결제', 'shop.total': '합계',
    'shop.emptyCart': '장바구니가 비어있습니다', 'shop.browseMenu': '메뉴를 둘러보세요',
    'shop.orderPlaced': '주문 완료!', 'shop.orderConfirmed': '주문이 확인되었습니다',
    'shop.subtotal': '소계', 'shop.shipping': '배송비', 'shop.free': '무료배송',
    'shop.outOfStock': '품절', 'shop.promoCode': '프로모코드', 'shop.apply': '적용',
    'banner.official': '공식 전자상거래 사이트 · ', 'banner.payWith': 'Ritual 테스트넷에서 RITUAL 결제',
    'general.connectWallet': '지갑 연결', 'general.loading': '로딩 중...',
    'feedback.title': '고객 리뷰', 'feedback.write': '리뷰 작성', 'feedback.submit': '제출',
    'footer.copyright': '© 2026 The Daily Cup. All rights reserved.',
  },
  th: {
    'nav.menu': 'เมนู', 'nav.orders': 'คำสั่งซื้อ', 'nav.track': 'ติดตาม', 'nav.feedback': 'รีวิว',
    'nav.admin': 'จัดการ', 'nav.cart': 'ตะกร้า',
    'shop.addToCart': 'เพิ่มในตะกร้า', 'shop.checkout': 'ชำระเงิน', 'shop.total': 'รวม',
    'shop.emptyCart': 'ตะกร้าว่าง', 'shop.browseMenu': 'เลือกดูเมนู',
    'shop.orderPlaced': 'สั่งซื้อสำเร็จ!', 'shop.subtotal': 'ราคารวม', 'shop.shipping': 'ค่าจัดส่ง', 'shop.free': 'ฟรี',
    'shop.outOfStock': 'สินค้าหมด', 'shop.promoCode': 'โค้ดส่วนลด', 'shop.apply': 'ใช้',
    'banner.official': 'เว็บไซต์อีคอมเมิร์ซอย่างเป็นทางการ · ', 'banner.payWith': 'ชำระด้วย RITUAL บน Ritual',
    'general.connectWallet': 'เชื่อมต่อกระเป๋า', 'general.loading': 'กำลังโหลด...',
    'feedback.title': 'รีวิวจากลูกค้า', 'feedback.write': 'เขียนรีวิว', 'feedback.submit': 'ส่งรีวิว',
    'footer.copyright': '© 2026 The Daily Cup. สงวนลิขสิทธิ์',
  },
  id: {
    'nav.menu': 'Menu', 'nav.orders': 'Pesanan', 'nav.track': 'Lacak', 'nav.feedback': 'Ulasan',
    'nav.admin': 'Admin', 'nav.cart': 'Keranjang',
    'shop.addToCart': 'Tambah ke Keranjang', 'shop.checkout': 'Bayar', 'shop.total': 'Total',
    'shop.emptyCart': 'Keranjang kosong', 'shop.browseMenu': 'Jelajahi menu kami',
    'shop.orderPlaced': 'Pesanan Berhasil!', 'shop.subtotal': 'Subtotal', 'shop.shipping': 'Ongkir', 'shop.free': 'GRATIS',
    'shop.outOfStock': 'Stok Habis', 'shop.promoCode': 'Kode Promo', 'shop.apply': 'Terapkan',
    'banner.official': 'Situs e-commerce resmi · ', 'banner.payWith': 'Bayar dengan RITUAL di Ritual',
    'general.connectWallet': 'Hubungkan Dompet', 'general.loading': 'Memuat...',
    'feedback.title': 'Ulasan Pelanggan', 'feedback.write': 'Tulis Ulasan', 'feedback.submit': 'Kirim',
    'footer.copyright': '© 2026 The Daily Cup. Hak cipta dilindungi.',
  },
  es: {
    'nav.menu': 'Menú', 'nav.orders': 'Pedidos', 'nav.track': 'Rastrear', 'nav.feedback': 'Reseñas',
    'nav.admin': 'Admin', 'nav.cart': 'Carrito',
    'shop.addToCart': 'Añadir al Carrito', 'shop.checkout': 'Pagar', 'shop.total': 'Total',
    'shop.emptyCart': 'Carrito vacío', 'shop.browseMenu': 'Explora nuestro menú',
    'shop.orderPlaced': '¡Pedido Realizado!', 'shop.subtotal': 'Subtotal', 'shop.shipping': 'Envío', 'shop.free': 'GRATIS',
    'shop.outOfStock': 'Agotado', 'shop.promoCode': 'Código Promocional', 'shop.apply': 'Aplicar',
    'banner.official': 'Sitio de comercio electrónico oficial · ', 'banner.payWith': 'Paga con RITUAL en Ritual',
    'general.connectWallet': 'Conectar Billetera', 'general.loading': 'Cargando...',
    'feedback.title': 'Opiniones de Clientes', 'feedback.write': 'Escribir Reseña', 'feedback.submit': 'Enviar',
    'footer.copyright': '© 2026 The Daily Cup. Todos los derechos reservados.',
  },
  fr: {
    'nav.menu': 'Menu', 'nav.orders': 'Commandes', 'nav.track': 'Suivi', 'nav.feedback': 'Avis',
    'nav.admin': 'Admin', 'nav.cart': 'Panier',
    'shop.addToCart': 'Ajouter au Panier', 'shop.checkout': 'Payer', 'shop.total': 'Total',
    'shop.emptyCart': 'Panier vide', 'shop.browseMenu': 'Explorez notre menu',
    'shop.orderPlaced': 'Commande Passée !', 'shop.subtotal': 'Sous-total', 'shop.shipping': 'Livraison', 'shop.free': 'GRATUIT',
    'shop.outOfStock': 'Rupture de Stock', 'shop.promoCode': 'Code Promo', 'shop.apply': 'Appliquer',
    'banner.official': 'Site e-commerce officiel · ', 'banner.payWith': 'Payez en RITUAL sur Ritual',
    'general.connectWallet': 'Connecter le Portefeuille', 'general.loading': 'Chargement...',
    'feedback.title': 'Avis Clients', 'feedback.write': 'Écrire un Avis', 'feedback.submit': 'Envoyer',
    'footer.copyright': '© 2026 The Daily Cup. Tous droits réservés.',
  },
  pt: {
    'nav.menu': 'Cardápio', 'nav.orders': 'Pedidos', 'nav.track': 'Rastrear', 'nav.feedback': 'Avaliações',
    'nav.admin': 'Admin', 'nav.cart': 'Carrinho',
    'shop.addToCart': 'Adicionar ao Carrinho', 'shop.checkout': 'Pagar', 'shop.total': 'Total',
    'shop.emptyCart': 'Carrinho vazio', 'shop.browseMenu': 'Explore nosso cardápio',
    'shop.orderPlaced': 'Pedido Realizado!', 'shop.subtotal': 'Subtotal', 'shop.shipping': 'Frete', 'shop.free': 'GRÁTIS',
    'shop.outOfStock': 'Esgotado', 'shop.promoCode': 'Código Promocional', 'shop.apply': 'Aplicar',
    'banner.official': 'Site de e-commerce oficial · ', 'banner.payWith': 'Pague com RITUAL na Ritual',
    'general.connectWallet': 'Conectar Carteira', 'general.loading': 'Carregando...',
    'feedback.title': 'Avaliações de Clientes', 'feedback.write': 'Escrever Avaliação', 'feedback.submit': 'Enviar',
    'footer.copyright': '© 2026 The Daily Cup. Todos os direitos reservados.',
  },
  ar: {
    'nav.menu': 'القائمة', 'nav.orders': 'الطلبات', 'nav.track': 'التتبع', 'nav.feedback': 'التقييمات',
    'nav.admin': 'الإدارة', 'nav.cart': 'السلة',
    'shop.addToCart': 'أضف إلى السلة', 'shop.checkout': 'الدفع', 'shop.total': 'المجموع',
    'shop.emptyCart': 'السلة فارغة', 'shop.browseMenu': 'تصفح قائمتنا',
    'shop.orderPlaced': 'تم الطلب!', 'shop.subtotal': 'المجموع الفرعي', 'shop.shipping': 'التوصيل', 'shop.free': 'مجاني',
    'shop.outOfStock': 'نفذ من المخزون', 'shop.promoCode': 'رمز الخصم', 'shop.apply': 'تطبيق',
    'banner.official': 'الموقع الرسمي للتجارة الإلكترونية · ', 'banner.payWith': 'ادفع بـ RITUAL على Ritual',
    'general.connectWallet': 'ربط المحفظة', 'general.loading': 'جاري التحميل...',
    'feedback.title': 'آراء العملاء', 'feedback.write': 'اكتب تقييم', 'feedback.submit': 'إرسال',
    'footer.copyright': '© 2026 The Daily Cup. جميع الحقوق محفوظة.',
  },
  hi: {
    'nav.menu': 'मेन्यू', 'nav.orders': 'ऑर्डर', 'nav.track': 'ट्रैक', 'nav.feedback': 'समीक्षा',
    'nav.admin': 'एडमिन', 'nav.cart': 'कार्ट',
    'shop.addToCart': 'कार्ट में जोड़ें', 'shop.checkout': 'भुगतान', 'shop.total': 'कुल',
    'shop.emptyCart': 'कार्ट खाली है', 'shop.browseMenu': 'हमारा मेन्यू देखें',
    'shop.orderPlaced': 'ऑर्डर हो गया!', 'shop.subtotal': 'उप-कुल', 'shop.shipping': 'शिपिंग', 'shop.free': 'मुफ्त',
    'shop.outOfStock': 'स्टॉक खत्म', 'shop.promoCode': 'प्रोमो कोड', 'shop.apply': 'लागू करें',
    'banner.official': 'आधिकारिक ई-कॉमर्स साइट · ', 'banner.payWith': 'Ritual पर RITUAL से भुगतान करें',
    'general.connectWallet': 'वॉलेट कनेक्ट करें', 'general.loading': 'लोड हो रहा है...',
    'feedback.title': 'ग्राहक समीक्षा', 'feedback.write': 'समीक्षा लिखें', 'feedback.submit': 'भेजें',
    'footer.copyright': '© 2026 The Daily Cup. सर्वाधिकार सुरक्षित.',
  },
  de: {
    'nav.menu': 'Speisekarte', 'nav.orders': 'Bestellungen', 'nav.track': 'Verfolgen', 'nav.feedback': 'Bewertungen',
    'nav.admin': 'Admin', 'nav.cart': 'Warenkorb',
    'shop.addToCart': 'In den Warenkorb', 'shop.checkout': 'Bezahlen', 'shop.total': 'Gesamt',
    'shop.emptyCart': 'Warenkorb leer', 'shop.browseMenu': 'Unsere Speisekarte entdecken',
    'shop.orderPlaced': 'Bestellung aufgegeben!', 'shop.subtotal': 'Zwischensumme', 'shop.shipping': 'Versand', 'shop.free': 'KOSTENLOS',
    'shop.outOfStock': 'Ausverkauft', 'shop.promoCode': 'Gutscheincode', 'shop.apply': 'Anwenden',
    'banner.official': 'Offizielle E-Commerce-Seite · ', 'banner.payWith': 'Bezahlen mit RITUAL auf Ritual',
    'general.connectWallet': 'Wallet verbinden', 'general.loading': 'Laden...',
    'feedback.title': 'Kundenbewertungen', 'feedback.write': 'Bewertung schreiben', 'feedback.submit': 'Absenden',
    'footer.copyright': '© 2026 The Daily Cup. Alle Rechte vorbehalten.',
  },
  ru: {
    'nav.menu': 'Меню', 'nav.orders': 'Заказы', 'nav.track': 'Отследить', 'nav.feedback': 'Отзывы',
    'nav.admin': 'Админ', 'nav.cart': 'Корзина',
    'shop.addToCart': 'В корзину', 'shop.checkout': 'Оплата', 'shop.total': 'Итого',
    'shop.emptyCart': 'Корзина пуста', 'shop.browseMenu': 'Посмотреть меню',
    'shop.orderPlaced': 'Заказ оформлен!', 'shop.subtotal': 'Подитог', 'shop.shipping': 'Доставка', 'shop.free': 'БЕСПЛАТНО',
    'shop.outOfStock': 'Нет в наличии', 'shop.promoCode': 'Промокод', 'shop.apply': 'Применить',
    'banner.official': 'Официальный сайт · ', 'banner.payWith': 'Оплата RITUAL в Ritual',
    'general.connectWallet': 'Подключить кошелёк', 'general.loading': 'Загрузка...',
    'feedback.title': 'Отзывы клиентов', 'feedback.write': 'Написать отзыв', 'feedback.submit': 'Отправить',
    'footer.copyright': '© 2026 The Daily Cup. Все права защищены.',
  },
  ms: {
    'nav.menu': 'Menu', 'nav.orders': 'Pesanan', 'nav.track': 'Jejak', 'nav.feedback': 'Ulasan',
    'nav.admin': 'Admin', 'nav.cart': 'Troli',
    'shop.addToCart': 'Tambah ke Troli', 'shop.checkout': 'Bayar', 'shop.total': 'Jumlah',
    'shop.emptyCart': 'Troli kosong', 'shop.browseMenu': 'Terokai menu kami',
    'shop.orderPlaced': 'Pesanan Berjaya!', 'shop.subtotal': 'Subjumlah', 'shop.shipping': 'Penghantaran', 'shop.free': 'PERCUMA',
    'shop.outOfStock': 'Stok Habis', 'shop.promoCode': 'Kod Promo', 'shop.apply': 'Guna',
    'banner.official': 'Laman e-dagang rasmi · ', 'banner.payWith': 'Bayar dengan RITUAL di Ritual',
    'general.connectWallet': 'Sambung Dompet', 'general.loading': 'Memuatkan...',
    'feedback.title': 'Ulasan Pelanggan', 'feedback.write': 'Tulis Ulasan', 'feedback.submit': 'Hantar',
    'footer.copyright': '© 2026 The Daily Cup. Hak cipta terpelihara.',
  },
};

const STORAGE_KEY = 'coffeehouse_lang';

function getStoredLang(): LangCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.find(l => l.code === stored)) return stored as LangCode;
  } catch {}
  return 'en';
}

export function useTranslation() {
  const [lang, setLang] = useState<LangCode>(getStoredLang);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  }, [lang]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return translations[lang]?.[key] ?? translations.en[key] ?? fallback ?? key;
    },
    [lang]
  );

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const idx = LANGUAGES.findIndex(l => l.code === prev);
      return LANGUAGES[(idx + 1) % LANGUAGES.length].code;
    });
  }, []);

  return { t, lang, setLang, toggleLang };
}



