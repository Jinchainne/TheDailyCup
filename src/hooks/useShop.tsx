import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { STORE_LOCATIONS } from '../data/storeLocations';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  brand: string;
  // New: variants & inventory
  sizes?: { label: string; priceAdd: number }[];  // e.g. [{label:'M',priceAdd:0},{label:'L',priceAdd:1}]
  temperatures?: string[];                         // e.g. ['Hot','Iced']
  stock?: number;                                   // -1 = unlimited, 0 = out of stock, >0 = limited
  featured?: boolean;                               // show in featured section
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;      // e.g. 'L'
  selectedTemp?: string;      // e.g. 'Iced'
  unitPrice?: number;         // price with size modifier
}

export interface DeliveryAddress {
  lat: number;
  lng: number;
  address: string;
  note: string;
}

export interface Order {
  id: string;
  code: string; // 6-char tracking code e.g. "ARX-K7M2P"
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled' | 'refunded';
  txHash?: string;
  timestamp: number;
  merchantAddress: string;
  customerWallet: string;
  delivery?: DeliveryAddress;
  shippingFee: number;
  // Status timestamps for transparency
  confirmedAt?: number;
  preparingAt?: number;
  shippingAt?: number;
  deliveredAt?: number;
  cancelledAt?: number;
  cancelReason?: string;
}

export function generateOrderCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RTL-';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export const MERCHANT_ADDRESS = '0x363700d10ca9c4809ad7034f5b21650a9a5e34bd';

// Shipping configuration
export interface ShippingConfig {
  freeRadiusKm: number;    // Free shipping radius in km
  pricePerKm: number;      // Price per km beyond free radius
  maxFee: number;          // Maximum shipping fee cap
}

const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  freeRadiusKm: 10,
  pricePerKm: 0.1,
  maxFee: 10,
};

export function getShippingConfig(): ShippingConfig {
  try {
    const saved = localStorage.getItem('coffeehouse_shipping_config');
    return saved ? { ...DEFAULT_SHIPPING_CONFIG, ...JSON.parse(saved) } : DEFAULT_SHIPPING_CONFIG;
  } catch { return DEFAULT_SHIPPING_CONFIG; }
}

export function saveShippingConfig(config: ShippingConfig) {
  localStorage.setItem('coffeehouse_shipping_config', JSON.stringify(config));
}

export function calcShippingFeeFromConfig(lat: number, lng: number, config?: ShippingConfig): number {
  const cfg = config || getShippingConfig();
  let minKm = Infinity;
  for (const store of STORE_LOCATIONS) {
    const R = 6371;
    const dLat = ((lat - store.lat) * Math.PI) / 180;
    const dLng = ((lng - store.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((store.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (km < minKm) minKm = km;
  }
  if (minKm <= cfg.freeRadiusKm) return 0;
  const extraKm = minKm - cfg.freeRadiusKm;
  return Math.min(cfg.maxFee, Math.round(extraKm * cfg.pricePerKm * 100) / 100);
}


const PRODUCTS: Product[] = [
  // ═══════════ STARBUCKS ═══════════
  { id: 'sb1', name: 'Caffè Latte', price: 5.75, category: 'Hot Coffee', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', description: 'Rich espresso topped with steamed milk and a light layer of foam', sizes: [{label:'M',priceAdd:0},{label:'L',priceAdd:1}], temperatures: ['Hot','Iced'], stock: -1 },
  { id: 'sb2', name: 'Cappuccino', price: 5.45, category: 'Hot Coffee', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop', description: 'Espresso with steamed milk and a deep layer of foam', sizes: [{label:'M',priceAdd:0},{label:'L',priceAdd:1}], temperatures: ['Hot','Iced'], stock: -1 },
  { id: 'sb3', name: 'Caramel Macchiato', price: 6.25, category: 'Hot Coffee', brand: 'Starbucks', image: 'https://i.pinimg.com/736x/06/ed/b5/06edb5e88de8b3e7ef8ba18a7ef83d66.jpg', description: 'Freshly steamed milk with vanilla-flavored syrup and espresso', sizes: [{label:'M',priceAdd:0},{label:'L',priceAdd:1.5}], temperatures: ['Hot','Iced'], stock: -1 },
  { id: 'sb4', name: 'Caffè Mocha', price: 5.95, category: 'Hot Coffee', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&h=400&fit=crop', description: 'Espresso with bittersweet mocha sauce and steamed milk', sizes: [{label:'M',priceAdd:0},{label:'L',priceAdd:1}], temperatures: ['Hot','Iced'], stock: -1 },
  { id: 'sb5', name: 'Flat White', price: 5.95, category: 'Hot Coffee', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=400&h=400&fit=crop', description: 'Smooth ristretto shots with velvety steamed milk', sizes: [{label:'M',priceAdd:0},{label:'L',priceAdd:1}], temperatures: ['Hot'], stock: -1 },
  { id: 'sb6', name: 'Blonde Vanilla Latte', price: 6.05, category: 'Hot Coffee', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop', description: 'Blonde espresso with vanilla syrup and steamed milk', sizes: [{label:'M',priceAdd:0},{label:'L',priceAdd:1}], temperatures: ['Hot','Iced'], stock: -1 },
  { id: 'sb7', name: 'Iced Brown Sugar Oatmilk Shaken Espresso', price: 6.75, category: 'Cold Coffee', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=400&fit=crop', description: 'Blonde espresso with brown sugar and cinnamon, shaken with oatmilk', sizes: [{label:'M',priceAdd:0},{label:'L',priceAdd:1}], temperatures: ['Iced'], stock: -1 },
  { id: 'sb8', name: 'Cold Brew', price: 4.75, category: 'Cold Coffee', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop', description: 'Slow-steeped, super-smooth cold coffee served over ice', sizes: [{label:'M',priceAdd:0},{label:'L',priceAdd:1}], temperatures: ['Iced'], stock: -1 },
  { id: 'sb9', name: 'Iced Caramel Macchiato', price: 6.45, category: 'Cold Coffee', brand: 'Starbucks', image: 'https://www.starbucks.co.nz/content/menu/0664253001647830363.jpg', description: 'Espresso poured over cold milk with vanilla and caramel drizzle', sizes: [{label:'M',priceAdd:0},{label:'L',priceAdd:1}], temperatures: ['Iced'], stock: -1 },
  { id: 'sb10', name: 'Mocha Frappuccino', price: 5.95, category: 'Cold Coffee', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop', description: 'Coffee blended with mocha sauce, milk and ice' },
  { id: 'sb11', name: 'Matcha Latte', price: 5.75, category: 'Tea', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&h=400&fit=crop', description: 'Smooth and creamy matcha sweetened just right and served with milk' },
  { id: 'sb12', name: 'Chai Latte', price: 5.45, category: 'Tea', brand: 'Starbucks', image: 'https://cdn7.kiwilimon.com/recetaimagen/40439/960x640/53801.jpg.jpg', description: 'Black tea infused with cinnamon, clove and other warming spices' },
  { id: 'sb13', name: 'Pineapple Passionfruit Refresher', price: 5.25, category: 'Refreshers', brand: 'Starbucks', image: 'https://i.pinimg.com/736x/f3/36/34/f3363449fdf64548b7ed4877349a2223.jpg', description: 'Tropical flavors of pineapple and passionfruit combined with coconutmilk' },
  { id: 'sb14', name: 'Butter Croissant', price: 3.75, category: 'Bakery', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400&h=400&fit=crop', description: 'Buttery, flaky, golden croissant baked fresh daily' },
  { id: 'sb15', name: 'Chocolate Chip Cookie', price: 3.25, category: 'Bakery', brand: 'Starbucks', image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop', description: 'Classic cookie loaded with semi-sweet chocolate chips' },

  // ═══════════ McDONALD'S ═══════════
  { id: 'mc1', name: 'Big Mac', price: 5.99, category: 'Burgers', brand: "McDonald's", image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Big_Mac_hamburger.jpg/1280px-Big_Mac_hamburger.jpg', description: 'Two all-beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun' },
  { id: 'mc2', name: 'Quarter Pounder with Cheese', price: 6.39, category: 'Burgers', brand: "McDonald's", image: 'https://static.wikia.nocookie.net/ronaldmcdonald/images/2/22/QuarterPounderCheeseDeluxe.jpg', description: 'Quarter pound of 100% fresh beef with cheese, onions, pickles' },
  { id: 'mc3', name: 'McChicken', price: 3.89, category: 'Burgers', brand: "McDonald's", image: 'https://i.pinimg.com/736x/93/c5/92/93c5922a35ffd3485c354cb9b849fb76.jpg', description: 'Crispy chicken patty with lettuce and mayo on a toasted bun' },
  { id: 'mc4', name: 'Chicken McNuggets (10pc)', price: 5.99, category: 'Chicken', brand: "McDonald's", image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/McDonalds-Chicken-McNuggets.jpg/1280px-McDonalds-Chicken-McNuggets.jpg', description: 'Tender white meat chicken, seasoned and breaded to perfection' },
  { id: 'mc5', name: 'World Famous Fries (Large)', price: 3.89, category: 'Sides', brand: "McDonald's", image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop', description: 'Golden, crispy fries made from premium potatoes' },
  { id: 'mc6', name: 'Egg McMuffin', price: 4.39, category: 'Breakfast', brand: "McDonald's", image: 'https://i.pinimg.com/736x/12/eb/90/12eb90051010fc5580b8bfdbb961d5e2.jpg', description: 'Egg, Canadian bacon and American cheese on an English muffin' },
  { id: 'mc7', name: 'Hotcakes', price: 4.19, category: 'Breakfast', brand: "McDonald's", image: 'https://media.istockphoto.com/id/462256873/ru/%D1%84%D0%BE%D1%82%D0%BE/%D0%BA%D1%83%D1%87%D0%B0-%D0%B1%D0%BB%D0%B8%D0%BD%D1%8B-%D0%B8%D0%B7%D0%BE%D0%BB%D0%B8%D1%80%D0%BE%D0%B2%D0%B0%D0%BD-%D0%BD%D0%B0-%D0%B1%D0%B5%D0%BB%D0%BE%D0%BC.jpg', description: 'Three golden brown, fluffy hotcakes served with butter and syrup' },
  { id: 'mc8', name: 'McFlurry with OREO', price: 4.39, category: 'Desserts', brand: "McDonald's", image: 'https://irecommend.ru/sites/default/files/product-images/458925/QgWC5y5ojIVZbnLBbhFhCg.png', description: 'Vanilla soft serve blended with OREO cookie pieces' },
  { id: 'mc9', name: 'Apple Pie', price: 1.99, category: 'Desserts', brand: "McDonald's", image: 'https://media.gettyimages.com/id/2180059955/photo/top-view-of-slice-of-traditional-european-apple-pie-with-topping-crumbles-called-streusel.jpg', description: 'Hot, crispy apple pie with a flaky crust and warm apple filling' },
  { id: 'mc10', name: 'Coca-Cola (Large)', price: 2.19, category: 'Drinks', brand: "McDonald's", image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop', description: 'Ice-cold Coca-Cola fountain drink' },
  { id: 'mc11', name: 'McCafé Iced Coffee', price: 2.99, category: 'Cold Coffee', brand: "McDonald's", image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop', description: 'Premium roast coffee served over ice with cream and sugar' },
  { id: 'mc12', name: 'Onion Rings', price: 3.29, category: 'Sides', brand: "McDonald's", image: 'https://media.istockphoto.com/id/2165886830/ru/%D1%84%D0%BE%D1%82%D0%BE/%D0%BE%D0%B1%D0%B6%D0%B0%D1%80%D0%B5%D0%BD%D0%BD%D1%8B%D0%B5-%D0%B2%D0%BE-%D1%84%D1%80%D0%B8%D1%82%D1%8E%D1%80%D0%B5-%D0%BB%D1%83%D0%BA%D0%BE%D0%B2%D1%8B%D0%B5-%D0%BA%D0%BE%D0%BB%D1%8C%D1%86%D0%B0.jpg', description: 'Crispy battered onion rings, golden fried' },

  // ═══════════ DUNKIN' ═══════════
  { id: 'dk1', name: 'Original Blend Coffee', price: 2.59, category: 'Hot Coffee', brand: "Dunkin'", image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop', description: 'Medium roast, smooth and rich signature blend' },
  { id: 'dk2', name: 'Caramel Iced Coffee', price: 3.59, category: 'Cold Coffee', brand: "Dunkin'", image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=400&fit=crop', description: 'Iced coffee with caramel swirl and cream' },
  { id: 'dk3', name: 'Butter Pecan Iced Coffee', price: 3.59, category: 'Cold Coffee', brand: "Dunkin'", image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&h=400&fit=crop', description: 'Iced coffee with butter pecan flavor swirl' },
  { id: 'dk4', name: 'Matcha Latte', price: 4.59, category: 'Tea', brand: "Dunkin'", image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&h=400&fit=crop', description: 'Sweetened matcha green tea blended with milk' },
  { id: 'dk5', name: 'Glazed Donut', price: 1.49, category: 'Bakery', brand: "Dunkin'", image: 'https://irecommend.ru/sites/default/files/imagecache/copyright1/user-images/1322331/U8BOvx0Z4XLIvUiWqQr4w.jpg', description: 'Classic yeast donut with sweet glaze' },
  { id: 'dk6', name: 'Chocolate Frosted Donut', price: 1.69, category: 'Bakery', brand: "Dunkin'", image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&fit=crop', description: 'Yeast donut with rich chocolate frosting' },
  { id: 'dk7', name: 'Bacon Egg & Cheese', price: 4.79, category: 'Breakfast', brand: "Dunkin'", image: 'https://i.pinimg.com/originals/7a/dc/11/7adc11022b7b2fc3e31108b00aee737b.jpg', description: 'Crispy bacon, egg and American cheese on a croissant' },
  { id: 'dk8', name: 'Blueberry Muffin', price: 2.59, category: 'Bakery', brand: "Dunkin'", image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=400&fit=crop', description: 'Moist muffin packed with wild blueberries' },
  { id: 'dk9', name: 'Hash Browns', price: 1.69, category: 'Sides', brand: "Dunkin'", image: 'https://img.povar.ru/mobile/14/25/ff/60/kartofelnii_hashbraun-317630.jpg', description: 'Crispy golden hash brown bites' },

  // ═══════════ JOLLIBEE ═══════════
  { id: 'jb1', name: 'Chickenjoy (2pc)', price: 7.99, category: 'Chicken', brand: 'Jollibee', image: 'https://www.sixsistersstuff.com/wp-content/uploads/2025/05/Crispy-Fried-Chicken.jpg', description: 'Crispylicious, juicylicious fried chicken' },
  { id: 'jb2', name: 'Jolly Spaghetti', price: 5.49, category: 'Pasta', brand: 'Jollibee', image: 'https://assets.bonappetit.com/photos/65569a687039e628a5be8dac/1:1/w_2560,c_limit/20231005-1223-HOWWEHOLIDAY-3112.jpg', description: 'Sweet-style spaghetti with sliced hotdogs and ground meat' },
  { id: 'jb3', name: 'Yumburger', price: 2.99, category: 'Burgers', brand: 'Jollibee', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=400&fit=crop', description: 'Beefy, cheesy burger with special dressing' },
  { id: 'jb4', name: 'Chickenjoy Bucket (6pc)', price: 17.99, category: 'Chicken', brand: 'Jollibee', image: 'https://media.istockphoto.com/id/576730586/ru/%D1%84%D0%BE%D1%82%D0%BE/%D0%BA%D1%80%D0%B0%D1%81%D0%BD%D0%BE%D0%B5-%D0%B2%D0%B5%D0%B4%D1%80%D0%BE-%D0%B6%D0%B0%D1%80%D0%B5%D0%BD%D0%BE%D0%B9-%D0%BA%D1%83%D1%80%D0%B8%D1%86%D1%8B.jpg', description: '6 pieces of signature crispy fried chicken' },
  { id: 'jb5', name: 'Palabok Fiesta', price: 6.49, category: 'Pasta', brand: 'Jollibee', image: 'https://i.pinimg.com/736x/ca/18/3b/ca183b54b7121af54e0b665e32884db1.jpg', description: 'Rice noodles with garlic shrimp sauce, pork, and egg' },
  { id: 'jb6', name: 'Peach Mango Pie', price: 1.99, category: 'Desserts', brand: 'Jollibee', image: 'https://marleysmenu.com/wp-content/uploads/2021/05/Peach-Mango-Pie-overhead-shot-of-slice.jpg', description: 'Crispy pie filled with real peach and mango chunks' },
  { id: 'jb7', name: 'Jolly Crispy Fries', price: 2.79, category: 'Sides', brand: 'Jollibee', image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=400&fit=crop', description: 'Golden crispy fries with a side of gravy' },

  // ═══════════ PIZZA HUT ═══════════
  { id: 'ph1', name: 'Pepperoni Pizza (Personal)', price: 7.49, category: 'Pizza', brand: 'Pizza Hut', image: 'https://i.pinimg.com/736x/51/c7/24/51c724d28c8154d93c9e3c8719b8f233.jpg', description: 'Classic pepperoni with mozzarella on pan crust' },
  { id: 'ph2', name: 'Margherita Pizza (Personal)', price: 6.99, category: 'Pizza', brand: 'Pizza Hut', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop', description: 'Fresh mozzarella, basil, and marinara on hand-tossed crust' },
  { id: 'ph3', name: 'Garlic Bread', price: 3.99, category: 'Sides', brand: 'Pizza Hut', image: 'https://i.pinimg.com/736x/ac/61/a0/ac61a01ca04b5752faf8ef242308f5b5.jpg', description: 'Warm breadsticks brushed with garlic butter and parmesan' },

  // ═══════════ SUBWAY ═══════════
  { id: 'sw1', name: 'Italian B.M.T.', price: 7.49, category: 'Sandwiches', brand: 'Subway', image: 'https://cdn.iportal.ru/news/longreads/72782213/images/tild6432-3731-4131-b165-343836353661__1_.png', description: 'Genoa salami, pepperoni, ham with fresh veggies' },
  { id: 'sw2', name: 'Turkey Breast Sub', price: 6.99, category: 'Sandwiches', brand: 'Subway', image: 'https://cdn.thefreshmancook.com/wp-content/uploads/2024/07/Copy-of-Copy-of-Thefreshmancook-2024-07-18T015550.885.jpg', description: 'Sliced turkey breast on freshly baked bread' },
  { id: 'sw3', name: 'Chicken Teriyaki Sub', price: 7.99, category: 'Sandwiches', brand: 'Subway', image: 'https://i.pinimg.com/736x/4e/29/3d/4e293d27dae5d8c82c27fb1a6e89b60d.jpg', description: 'Sweet onion chicken teriyaki with fresh vegetables' },
  { id: 'sw4', name: 'Cookie (Chocolate Chip)', price: 1.29, category: 'Bakery', brand: 'Subway', image: 'https://i.pinimg.com/736x/fb/66/68/fb66684a706084a33ba7effa556a0e0e.jpg', description: 'Soft-baked chocolate chip cookie' },

  // ═══════════ SHAKE SHACK ═══════════
  { id: 'ss1', name: 'ShackBurger', price: 7.79, category: 'Burgers', brand: 'Shake Shack', image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=400&fit=crop', description: 'Angus beef cheeseburger with lettuce, tomato, ShackSauce' },
  { id: 'ss2', name: 'Chicken Shack', price: 7.99, category: 'Chicken', brand: 'Shake Shack', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop', description: 'Crispy chicken breast with lettuce, pickles, buttermilk herb mayo' },
  { id: 'ss3', name: 'Cheese Fries', price: 4.99, category: 'Sides', brand: 'Shake Shack', image: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Shake_shack_cheese_fries.jpg', description: 'Crinkle-cut fries topped with cheese sauce' },
  { id: 'ss4', name: 'Vanilla Shake', price: 5.99, category: 'Drinks', brand: 'Shake Shack', image: 'https://i.pinimg.com/736x/5d/38/12/5d3812da799e06b6a75bbd6a3b0cd5b5.jpg', description: 'Hand-spun vanilla frozen custard milkshake' },
  { id: 'ss5', name: 'Chocolate Shake', price: 5.99, category: 'Drinks', brand: 'Shake Shack', image: 'https://recipes.net/wp-content/uploads/2021/10/chocolate-milkshake-recipes.jpg', description: 'Hand-spun chocolate frozen custard milkshake' },

  // ═══════════ COFFEE BEAN ═══════════
  { id: 'cb1', name: 'Vanilla Latte', price: 5.75, category: 'Hot Coffee', brand: 'Coffee Bean', image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&h=400&fit=crop', description: 'Espresso with French vanilla and steamed milk' },
  { id: 'cb2', name: 'Ice Blended Mocha', price: 6.25, category: 'Cold Coffee', brand: 'Coffee Bean', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop', description: 'Rich chocolate and coffee blended with ice and milk' },
  { id: 'cb3', name: 'English Breakfast Tea', price: 3.50, category: 'Tea', brand: 'Coffee Bean', image: 'https://ir.ozone.ru/s3/multimedia-1-4/7200398668.jpg', description: 'Full-bodied black tea blend from Assam, Ceylon and Kenya' },
  { id: 'cb4', name: 'Tiramisu', price: 6.50, category: 'Desserts', brand: 'Coffee Bean', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop', description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone' },
  { id: 'cb5', name: 'Cinnamon Roll', price: 4.25, category: 'Bakery', brand: 'Coffee Bean', image: 'https://i.pinimg.com/736x/b7/3c/0d/b73c0dde3cdfa355cab0574af8f0a4e2.jpg', description: 'Warm cinnamon swirl with cream cheese frosting' },

  // ═══════════ JUICE BAR ═══════════
  { id: 'js1', name: 'Fresh Orange Juice', price: 4.50, category: 'Juice', brand: 'Fresh Bar', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop', description: 'Freshly squeezed oranges, no added sugar' },
  { id: 'js2', name: 'Mango Tropical Smoothie', price: 6.00, category: 'Juice', brand: 'Fresh Bar', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=400&fit=crop', description: 'Mango, pineapple, banana blended with coconut water' },
  { id: 'js3', name: 'Berry Antioxidant Blast', price: 6.50, category: 'Juice', brand: 'Fresh Bar', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop', description: 'Blueberry, strawberry, acai, and pomegranate blend' },
  { id: 'js4', name: 'Green Detox Smoothie', price: 6.50, category: 'Juice', brand: 'Fresh Bar', image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=400&fit=crop', description: 'Spinach, kale, apple, ginger, and lemon' },
  { id: 'js5', name: 'Lemon Mint Cooler', price: 4.00, category: 'Juice', brand: 'Fresh Bar', image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=400&fit=crop', description: 'Fresh lemon juice with mint and a hint of honey' },
  { id: 'js6', name: 'Bubble Milk Tea', price: 5.00, category: 'Tea', brand: 'Fresh Bar', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&h=400&fit=crop', description: 'Classic milk tea with chewy tapioca pearls' },
  { id: 'js7', name: 'Thai Iced Tea', price: 4.50, category: 'Tea', brand: 'Fresh Bar', image: 'https://i.pinimg.com/736x/8a/17/33/8a17334f13ad2e94fe959f3b43113030.jpg', description: 'Strong brewed Thai tea with sweetened condensed milk over ice' },

  // ═══════════ VIETNAMESE FOOD (VERIFIED IMAGES) ═══════════
  // Phở & Bún
  { id: 'vn1', name: 'Phở Bò Tái', price: 6.50, category: 'Pho & Noodles', brand: 'Phở Việt', image: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=400&h=400&fit=crop', description: 'Phở bò với thịt bò tái, nước dùng hầm xương 24 giờ' },
  { id: 'vn2', name: 'Phở Bò Chín', price: 6.50, category: 'Pho & Noodles', brand: 'Phở Việt', image: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=400&h=400&fit=crop', description: 'Phở bò với thịt bò chín mềm, hành ngò tươi' },
  { id: 'vn3', name: 'Phở Gà', price: 5.95, category: 'Pho & Noodles', brand: 'Phở Việt', image: 'https://i.pinimg.com/736x/9c/43/fa/9c43fa3321a2e4fc4d00e5edce461713.jpg', description: 'Phở gà ta nước trong, thịt gà xé phay' },
  { id: 'vn4', name: 'Bún Bò Huế', price: 7.25, category: 'Pho & Noodles', brand: 'Phở Việt', image: 'https://s3-eu-west-1.amazonaws.com/tscmediumimages/2021/03/14/601e7e748b62b23b3e44d06f/1615766123-7999604ea26bc34b76-61597906.jpeg', description: 'Bún bò Huế cay nồng, chả cua, giò heo' },
  { id: 'vn5', name: 'Bún Riêu Cua', price: 6.75, category: 'Pho & Noodles', brand: 'Phở Việt', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=400&fit=crop', description: 'Bún riêu cua đồng, cà chua, đậu hũ, tôm khô' },
  { id: 'vn6', name: 'Bún Chả Hà Nội', price: 7.50, category: 'Pho & Noodles', brand: 'Phở Việt', image: 'https://i.pinimg.com/736x/18/66/5e/18665ec9fd5f18f0d2f4bd9c433caef5.jpg', description: 'Bún chả Hà Nội — thịt nướng than hoa, nước mắm chua ngọt' },
  { id: 'vn7', name: 'Bún Đậu Mắm Tôm', price: 7.95, category: 'Pho & Noodles', brand: 'Phở Việt', image: 'https://i.pinimg.com/474x/71/1e/4b/711e4b4c402be172a9d06df5acedbc03.jpg', description: 'Bún đậu mắm tôm — đậu rán giòn, thịt luộc, rau sống' },
  { id: 'vn8', name: 'Bánh Canh Cua', price: 6.95, category: 'Pho & Noodles', brand: 'Phở Việt', image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=400&fit=crop', description: 'Bánh canh cua đặc sánh, tôm, chả cá' },
  { id: 'vn23', name: 'Bò Kho', price: 7.50, category: 'Pho & Noodles', brand: 'Phở Việt', image: 'https://www.chilipeppermadness.com/wp-content/uploads/2023/09/Bo-Kho-Recipe-Spicy-Vietnamese-Beef-Stew1.jpg', description: 'Bò kho mềm, cà rốt, sả, ăn với bánh mì hoặc bún' },

  // Cơm
  { id: 'vn9', name: 'Cơm Tấm Sườn Nướng', price: 7.50, category: 'Rice', brand: 'Cơm Việt', image: 'https://i.pinimg.com/736x/16/65/ef/1665efab31e1490abb0bf93fe5b51e80.jpg', description: 'Cơm tấm sườn nướng than hoa, chả trứng, nước mắm' },
  { id: 'vn10', name: 'Cơm Gà Hội An', price: 6.95, category: 'Rice', brand: 'Cơm Việt', image: 'https://i.pinimg.com/736x/98/ab/2b/98ab2bd374887074f162ae5a503f638f.jpg', description: 'Cơm gà Hội An — gà xé phay, rau răm, hành phi' },
  { id: 'vn11', name: 'Cơm Chiên Dương Châu', price: 6.50, category: 'Rice', brand: 'Cơm Việt', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Chinese_fried_rice_by_stu_spivack_in_Cleveland%2C_OH.jpg/1280px-Chinese_fried_rice_by_stu_spivack_in_Cleveland%2C_OH.jpg', description: 'Cơm chiên dương châu — tôm, lạp xưởng, trứng, đậu Hà Lan' },
  { id: 'vn12', name: 'Cơm Sườn Bì Chả', price: 8.25, category: 'Rice', brand: 'Cơm Việt', image: 'https://i.pinimg.com/736x/0f/c5/13/0fc51309dc5c31bdcfff8ad6edde3467.jpg', description: 'Cơm tấm đặc biệt — sườn nướng, bì, chả trứng' },

  // Lẩu
  { id: 'vn21', name: 'Lẩu Thái', price: 15.95, category: 'Hotpot', brand: 'Quán Việt', image: 'https://media.istockphoto.com/id/1185218546/ru/%D1%84%D0%BE%D1%82%D0%BE/%D1%82%D0%BE%D0%BC-%D1%8F%D0%BC-%D0%BA%D1%83%D0%BD%D0%B3-%D1%82%D0%B0%D0%B9%D1%81%D0%BA%D0%B8%D0%B9-%D1%81%D1%82%D0%B8%D0%BB%D1%8C-%D0%BC%D0%BE%D1%80%D0%B5%D0%BF%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82%D0%BE%D0%B2-%D0%B3%D0%BE%D1%80%D1%8F%D1%87%D0%B8%D0%B9-%D0%B3%D0%BE%D1%80%D1%88%D0%BE%D0%BA-%D1%82%D1%80%D0%B0%D0%B4%D0%B8%D1%86%D0%B8%D0%BE%D0%BD%D0%BD%D0%B0%D1%8F-%D0%B5%D0%B4%D0%B0-%D0%B2-%D1%82%D0%B0%D0%B9%D1%81%D0%BA%D0%BE%D0%BC-%D1%81%D1%82%D0%B8%D0%BB%D0%B5.jpg', description: 'Lẩu Thái chua cay — tôm, mực, cá, nấm, rau' },
  { id: 'vn22', name: 'Lẩu Bò Nhúng Dấm', price: 14.50, category: 'Hotpot', brand: 'Quán Việt', image: 'https://i.pinimg.com/736x/ff/c3/43/ffc3437ec341096b524cdaee975aab05.jpg', description: 'Lẩu bò nhúng dấm — bò Mỹ, bún, rau sống, nước chấm' },

  // Đồ Uống Việt
  { id: 'vn24', name: 'Cà Phê Sữa Đá', price: 3.50, category: 'Viet Drinks', brand: 'Cà Phê Việt', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Ca_Phe_Sua_Da.jpg/1200px-Ca_Phe_Sua_Da.jpg', description: 'Cà phê phin Robusta với sữa đặc, served over ice' },
  { id: 'vn25', name: 'Cà Phê Đen Đá', price: 2.75, category: 'Viet Drinks', brand: 'Cà Phê Việt', image: 'https://images.unsplash.com/photo-1497636577773-f123181845c1?w=400&h=400&fit=crop', description: 'Cà phê phin đen đậm đà, không sữa, served over ice' },
  { id: 'vn26', name: 'Bạc Xỉu', price: 3.75, category: 'Viet Drinks', brand: 'Cà Phê Việt', image: 'https://i.pinimg.com/736x/6b/a8/0b/6ba80bd900b87d1e6538f776e6dc124c.jpg', description: 'Bạc xỉu — sữa nóng với chút cà phê, kiểu Sài Gòn' },
  { id: 'vn27', name: 'Trà Đá', price: 1.00, category: 'Viet Drinks', brand: 'Cà Phê Việt', image: 'https://1phutsaigon.vn/wp-content/uploads/2023/11/dia-chi-tra-chanh-gia-tay-o-sai-gon-2.jpg', description: 'Trà đá Việt Nam — trà xanh ướp lạnh' },
  { id: 'vn28', name: 'Sinh Tố Bơ', price: 4.50, category: 'Viet Drinks', brand: 'Cà Phê Việt', image: 'https://img.povar.ru/mobile/79/35/52/23/smuzi_s_avokado_i_shpinatom-582426.jpg', description: 'Sinh tố bơ dẻo mịn với sữa đặc' },
  { id: 'vn29', name: 'Chè Ba Màu', price: 3.50, category: 'Viet Drinks', brand: 'Cà Phê Việt', image: 'https://static.vinwonders.com/production/vietnamese-three-color-dessert-banner.jpg', description: 'Chè ba màu — đậu đỏ, đậu xanh, thạch lá nứa, nước cốt dừa' },
  { id: 'vn30', name: 'Nước Mía', price: 2.00, category: 'Viet Drinks', brand: 'Cà Phê Việt', image: 'https://www.awesomecuisine.com/wp-content/uploads/2018/06/sugar_cane_juice.jpg', description: 'Nước mía tươi ép, thêm tắc' },

  // Tráng Miệng Việt
  { id: 'vn31', name: 'Chè Đậu Đỏ', price: 3.00, category: 'Viet Desserts', brand: 'Quán Việt', image: 'https://i.pinimg.com/originals/4f/1f/c8/4f1fc81b01efb6440bedd9f2f967da88.jpg', description: 'Chè đậu đỏ nước cốt dừa, thơm bùi' },
  { id: 'vn32', name: 'Bánh Flan (Caramen)', price: 2.50, category: 'Viet Desserts', brand: 'Quán Việt', image: 'https://i.pinimg.com/736x/06/b5/43/06b543c35ea7a3393f7c0f89728d106a.jpg', description: 'Bánh flan caramel mềm mịn, cà phê sữa' },
  { id: 'vn33', name: 'Kem Chuoi', price: 2.75, category: 'Viet Desserts', brand: 'Quan Viet', image: 'https://i.pinimg.com/736x/ac/07/1c/ac071c420967a304c4c2f07a326cd610.jpg', description: 'Banana coconut ice cream' },
];

export const CATEGORIES = ['All', 'Hot Coffee', 'Cold Coffee', 'Tea', 'Juice', 'Refreshers', 'Burgers', 'Chicken', 'Sandwiches', 'Pizza', 'Pasta', 'Sides', 'Breakfast', 'Bakery', 'Desserts', 'Drinks', 'Pho & Noodles', 'Rice', 'Hotpot', 'Viet Drinks', 'Viet Desserts'];
export const BRANDS = [...new Set(PRODUCTS.map(p => p.brand))];

interface ShopCtx {
  products: Product[];
  categories: string[];
  brands: string[];
  cart: CartItem[];
  orders: Order[];
  cartTotal: number;
  cartCount: number;
  addToCart: (product: Product, size?: string, temp?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  saveOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status'], txHash?: string) => void;
  getOrderByCode: (code: string) => Order | undefined;
  cancelOrder: (orderId: string, reason: string) => void;
  requestRefund: (orderId: string, reason: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  // Promo
  applyPromo: (code: string) => { success: boolean; message: string; discount: number };
  removePromo: () => void;
  promoCode: string;
  promoDiscount: number;
  // Recently viewed
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;
}

const ShopContext = createContext<ShopCtx | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('arcbank_orders');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('arcbank_products');
      return saved ? JSON.parse(saved) : PRODUCTS;
    } catch { return PRODUCTS; }
  });

  // Fetch latest products from server on mount
  useEffect(() => {
    fetch('/data/products.json')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.products?.length) {
          // Merge: server products as base, localStorage overrides on top
          const localOverrides = (() => {
            try {
              const saved = localStorage.getItem('arcbank_products');
              return saved ? JSON.parse(saved) : null;
            } catch { return null; }
          })();
          if (localOverrides) {
            // Merge: use local overrides for matching IDs, server for the rest
            const localMap = new Map(localOverrides.map((p: Product) => [p.id, p]));
            const merged = data.products.map((p: Product) => localMap.get(p.id) || p);
            // Add any local-only products (custom added)
            const serverIds = new Set(data.products.map((p: Product) => p.id));
            const localOnly = localOverrides.filter((p: Product) => !serverIds.has(p.id));
            setProducts([...localOnly, ...merged]);
          } else {
            setProducts(data.products);
          }
        }
      })
      .catch(() => { /* use default products */ });
  }, []);

  const persistProducts = useCallback((updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem('arcbank_products', JSON.stringify(updated));
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    persistProducts([{ ...product, id }, ...products]);
  }, [products, persistProducts]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    persistProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [products, persistProducts]);

  const deleteProduct = useCallback((id: string) => {
    persistProducts(products.filter(p => p.id !== id));
  }, [products, persistProducts]);

  const addToCart = useCallback((product: Product, size?: string, temp?: string) => {
    // Check stock
    if (product.stock === 0) return;
    // Calculate unit price with size modifier
    let unitPrice = product.price;
    if (size && product.sizes) {
      const sizeDef = product.sizes.find(s => s.label === size);
      if (sizeDef) unitPrice += sizeDef.priceAdd;
    }
    setCart(prev => {
      // Match by product id + size + temp
      const existing = prev.find(item =>
        item.product.id === product.id &&
        item.selectedSize === (size || undefined) &&
        item.selectedTemp === (temp || undefined)
      );
      if (existing) {
        return prev.map(item =>
          item === existing ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        product,
        quantity: 1,
        selectedSize: size || undefined,
        selectedTemp: temp || undefined,
        unitPrice,
      }];
    });
    // Decrease stock if limited
    if (product.stock && product.stock > 0) {
      updateProduct(product.id, { stock: product.stock - 1 });
    }
  }, [updateProduct]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setCart(prev => prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ));
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.unitPrice || item.product.price) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Promo code system
  const [promoCode, setPromoCode] = useState(() => {
    try { return localStorage.getItem('coffeehouse_promo_code') || ''; } catch { return ''; }
  });
  const [promoDiscount, setPromoDiscount] = useState(() => {
    try { return parseFloat(localStorage.getItem('coffeehouse_promo_discount') || '0'); } catch { return 0; }
  });

  const PROMO_CODES: Record<string, { type: 'percent' | 'fixed' | 'freeship'; value: number; minOrder?: number }> = {
    'WELCOME10': { type: 'percent', value: 10 },
    'SAVE5': { type: 'fixed', value: 5, minOrder: 20 },
    'FREESHIP': { type: 'freeship', value: 0 },
    'COFFEE20': { type: 'percent', value: 20, minOrder: 15 },
  };

  const applyPromo = useCallback((code: string): { success: boolean; message: string; discount: number } => {
    const upper = code.toUpperCase().trim();
    const promo = PROMO_CODES[upper];
    if (!promo) return { success: false, message: 'Invalid promo code', discount: 0 };
    if (promo.minOrder && cartTotal < promo.minOrder) {
      return { success: false, message: `Minimum order $${promo.minOrder.toFixed(2)} required`, discount: 0 };
    }
    let discount = 0;
    if (promo.type === 'percent') discount = cartTotal * promo.value / 100;
    else if (promo.type === 'fixed') discount = promo.value;
    setPromoCode(upper);
    setPromoDiscount(discount);
    localStorage.setItem('coffeehouse_promo_code', upper);
    localStorage.setItem('coffeehouse_promo_discount', discount.toString());
    return { success: true, message: promo.type === 'freeship' ? 'Free shipping applied!' : `$${discount.toFixed(2)} discount applied!`, discount };
  }, [cartTotal]);

  const removePromo = useCallback(() => {
    setPromoCode('');
    setPromoDiscount(0);
    localStorage.removeItem('coffeehouse_promo_code');
    localStorage.removeItem('coffeehouse_promo_discount');
  }, []);

  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('coffeehouse_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const addRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed(prev => {
      const updated = [productId, ...prev.filter(id => id !== productId)].slice(0, 20);
      localStorage.setItem('coffeehouse_recently_viewed', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Refund request
  const requestRefund = useCallback((orderId: string, reason: string) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: 'refunded' as const, cancelReason: reason, cancelledAt: Date.now() } : o);
      localStorage.setItem('arcbank_orders', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const saveOrder = useCallback((order: Order) => {
    setOrders(prev => {
      const updated = [order, ...prev];
      localStorage.setItem('arcbank_orders', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status'], txHash?: string) => {
    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId) return o;
        const now = Date.now();
        const timestampField = `${status}At` as keyof Order;
        return { ...o, status, txHash: txHash || o.txHash, [timestampField]: now };
      });
      localStorage.setItem('arcbank_orders', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getOrderByCode = useCallback((code: string) => {
    return orders.find(o => o.code === code.toUpperCase());
  }, [orders]);

  const cancelOrder = useCallback((orderId: string, reason: string) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const, cancelledAt: Date.now(), cancelReason: reason } : o);
      localStorage.setItem('arcbank_orders', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <ShopContext.Provider value={{
      products, categories: CATEGORIES, brands: BRANDS, cart, orders,
      cartTotal, cartCount, addToCart, removeFromCart, updateQuantity,
      clearCart, saveOrder, updateOrderStatus, getOrderByCode, cancelOrder, requestRefund,
      addProduct, updateProduct, deleteProduct,
      applyPromo, removePromo, promoCode, promoDiscount,
      recentlyViewed, addRecentlyViewed,
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}

