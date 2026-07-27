export interface VietnamStore {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region: 'North' | 'Central' | 'South';
}

// All 63 provinces/cities of Vietnam with real coordinates
export const VIETNAM_STORES: VietnamStore[] = [
  // ==================== NORTH ====================
  { id: 'VN-HN', name: 'Hà Nội', lat: 21.0285, lng: 105.8542, region: 'North' },
  { id: 'VN-HP', name: 'Hải Phòng', lat: 20.8449, lng: 106.6881, region: 'North' },
  { id: 'VN-QN', name: 'Quảng Ninh', lat: 20.9721, lng: 107.0452, region: 'North' },
  { id: 'VN-BG', name: 'Bắc Giang', lat: 21.2731, lng: 106.1946, region: 'North' },
  { id: 'VN-BN', name: 'Bắc Ninh', lat: 21.1861, lng: 106.0763, region: 'North' },
  { id: 'VN-HD', name: 'Hải Dương', lat: 20.9373, lng: 106.3145, region: 'North' },
  { id: 'VN-HY', name: 'Hưng Yên', lat: 20.8526, lng: 106.0169, region: 'North' },
  { id: 'VN-NB', name: 'Ninh Bình', lat: 20.2506, lng: 105.9745, region: 'North' },
  { id: 'VN-NĐ', name: 'Nam Định', lat: 20.4388, lng: 106.1621, region: 'North' },
  { id: 'VN-TB', name: 'Thái Bình', lat: 20.4463, lng: 106.3366, region: 'North' },
  { id: 'VN-VP', name: 'Vĩnh Phúc', lat: 21.3084, lng: 105.6047, region: 'North' },
  { id: 'VN-HG', name: 'Hà Giang', lat: 22.8026, lng: 104.9784, region: 'North' },
  { id: 'VN-TQ', name: 'Tuyên Quang', lat: 21.8237, lng: 105.2181, region: 'North' },
  { id: 'VN-LC', name: 'Lào Cai', lat: 22.4856, lng: 103.9707, region: 'North' },
  { id: 'VN-YB', name: 'Yên Bái', lat: 21.7229, lng: 104.9113, region: 'North' },
  { id: 'VN-PB', name: 'Phú Thọ', lat: 21.3996, lng: 105.2213, region: 'North' },
  { id: 'VN-TH', name: 'Thanh Hóa', lat: 19.8067, lng: 105.7852, region: 'North' },
  { id: 'VN-NA', name: 'Nghệ An', lat: 19.2342, lng: 105.4169, region: 'North' },
  { id: 'VN-HT', name: 'Hà Tĩnh', lat: 18.3428, lng: 105.9057, region: 'North' },
  { id: 'VN-QB', name: 'Quảng Bình', lat: 17.4686, lng: 106.6223, region: 'North' },
  { id: 'VN-LS', name: 'Lạng Sơn', lat: 21.8537, lng: 106.7615, region: 'North' },
  { id: 'VN-CK', name: 'Cao Bằng', lat: 22.6666, lng: 106.2640, region: 'North' },
  { id: 'VN-BK', name: 'Bắc Kạn', lat: 22.1474, lng: 105.8348, region: 'North' },
  { id: 'VN-ĐB', name: 'Điện Biên', lat: 21.4071, lng: 103.0227, region: 'North' },
  { id: 'VN-LB', name: 'Lai Châu', lat: 22.3862, lng: 103.4703, region: 'North' },
  { id: 'VN-SL', name: 'Sơn La', lat: 21.3270, lng: 103.9144, region: 'North' },
  { id: 'VN-HB', name: 'Hòa Bình', lat: 20.8441, lng: 105.3377, region: 'North' },
  { id: 'VN-TN2', name: 'Thái Nguyên', lat: 21.5928, lng: 105.8442, region: 'North' },

  // ==================== CENTRAL ====================
  { id: 'VN-QT', name: 'Quảng Trị', lat: 16.7436, lng: 107.1948, region: 'Central' },
  { id: 'VN-TTH', name: 'Thừa Thiên Huế', lat: 16.4637, lng: 107.5909, region: 'Central' },
  { id: 'VN-DN', name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022, region: 'Central' },
  { id: 'VN-QN2', name: 'Quảng Nam', lat: 15.5394, lng: 108.0191, region: 'Central' },
  { id: 'VN-QG', name: 'Quảng Ngãi', lat: 15.1214, lng: 108.8044, region: 'Central' },
  { id: 'VN-BĐN', name: 'Bình Định', lat: 13.7705, lng: 109.2197, region: 'Central' },
  { id: 'VN-PY', name: 'Phú Yên', lat: 13.0882, lng: 109.0929, region: 'Central' },
  { id: 'VN-KH', name: 'Khánh Hòa', lat: 12.2388, lng: 109.1967, region: 'Central' },
  { id: 'VN-NT', name: 'Ninh Thuận', lat: 11.5810, lng: 108.9876, region: 'Central' },
  { id: 'VN-BT', name: 'Bình Thuận', lat: 11.0904, lng: 108.0721, region: 'Central' },
  { id: 'VN-KT', name: 'Kon Tum', lat: 14.3497, lng: 108.0005, region: 'Central' },
  { id: 'VN-GL', name: 'Gia Lai', lat: 13.9809, lng: 108.0145, region: 'Central' },
  { id: 'VN-ĐL', name: 'Đắk Lắk', lat: 12.7100, lng: 108.2378, region: 'Central' },
  { id: 'VN-ĐN2', name: 'Đắk Nông', lat: 12.0040, lng: 107.6875, region: 'Central' },
  { id: 'VN-LĐ', name: 'Lâm Đồng', lat: 11.9404, lng: 108.4583, region: 'Central' },
  { id: 'VN-QNAM', name: 'Quảng Bình (Đồng Hới)', lat: 17.4686, lng: 106.6223, region: 'Central' },
  { id: 'VN-HNA', name: 'Hà Nam', lat: 20.5411, lng: 105.9089, region: 'North' },

  // ==================== SOUTH ====================
  { id: 'VN-HCM', name: 'Hồ Chí Minh', lat: 10.8231, lng: 106.6297, region: 'South' },
  { id: 'VN-BD', name: 'Bình Dương', lat: 11.1741, lng: 106.6413, region: 'South' },
  { id: 'VN-DN3', name: 'Đồng Nai', lat: 10.9457, lng: 106.8243, region: 'South' },
  { id: 'VN-BRVT', name: 'Bà Rịa-Vũng Tàu', lat: 10.5417, lng: 107.2431, region: 'South' },
  { id: 'VN-TN', name: 'Tây Ninh', lat: 11.3667, lng: 106.1000, region: 'South' },
  { id: 'VN-LA', name: 'Long An', lat: 10.6956, lng: 106.2431, region: 'South' },
  { id: 'VN-TG', name: 'Tiền Giang', lat: 10.3555, lng: 106.3531, region: 'South' },
  { id: 'VN-BT2', name: 'Bến Tre', lat: 10.2415, lng: 106.3757, region: 'South' },
  { id: 'VN-VL', name: 'Vĩnh Long', lat: 10.2396, lng: 105.9572, region: 'South' },
  { id: 'VN-TA', name: 'Trà Vinh', lat: 9.9347, lng: 106.3456, region: 'South' },
  { id: 'VN-ĐT', name: 'Đồng Tháp', lat: 10.4938, lng: 105.6882, region: 'South' },
  { id: 'VN-AG', name: 'An Giang', lat: 10.5216, lng: 105.1259, region: 'South' },
  { id: 'VN-KG', name: 'Kiên Giang', lat: 10.0125, lng: 105.0809, region: 'South' },
  { id: 'VN-CT', name: 'Cần Thơ', lat: 10.0452, lng: 105.7469, region: 'South' },
  { id: 'VN-HG2', name: 'Hậu Giang', lat: 9.7846, lng: 105.6412, region: 'South' },
  { id: 'VN-ST', name: 'Sóc Trăng', lat: 9.6026, lng: 105.9735, region: 'South' },
  { id: 'VN-BL', name: 'Bạc Liêu', lat: 9.2813, lng: 105.7241, region: 'South' },
  { id: 'VN-CM', name: 'Cà Mau', lat: 9.1768, lng: 105.1524, region: 'South' },
];

// Haversine distance in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate shipping fee between a store and a destination.
 * Base fee: 0.50 RITUAL + 0.10 RITUAL per km (straight-line), capped at 5.00 RITUAL.
 */
export function calcShippingFee(
  storeLat: number,
  storeLng: number,
  destLat: number,
  destLng: number,
): number {
  const BASE_FEE = 0.50;
  const PER_KM = 0.10;
  const MAX_FEE = 5.00;

  const distanceKm = haversineDistance(storeLat, storeLng, destLat, destLng);
  const fee = BASE_FEE + PER_KM * distanceKm;
  return Math.min(fee, MAX_FEE);
}

