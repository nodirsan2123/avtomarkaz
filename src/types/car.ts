export type FuelType = 'Benzin' | 'Gibrid' | 'Elektromobil' | 'Gaz-Benzin' | 'Dizel';
export type Transmission = 'Avtomat' | 'Mexanika' | 'Variator' | 'Robot';
export type BodyStyle = 'Sedan' | 'Krossover' | 'Fastbek' | 'Xetchbek' | "Yo'ltanlamas";
export type CarCondition = 'Yangi' | 'Minilgan';
export type ListingStatus = 'active' | 'sold';
export type InquiryStatus = 'pending' | 'accepted' | 'declined';
export type PresetKey =
  | 'white_sedan'
  | 'grey_suv'
  | 'black_fastback'
  | 'silver_camry'
  | 'emerald_suv'
  | 'slate_crossover';

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'mileage_asc';
export type NavTab = 'all' | 'new' | 'saved' | 'mine';

export interface CarListing {
  id: string;
  sellerId: string;
  sellerName: string;
  brand: string;
  model: string;
  year: number;
  priceUsd: number;
  mileageKm: number;
  fuelType: FuelType;
  transmission: Transmission;
  bodyStyle: BodyStyle;
  color: string;
  condition: CarCondition;
  city: string;
  description: string;
  imageUrl: string;
  presetKey: PresetKey;
  status: ListingStatus;
  createdAtMs: number;
  updatedAtMs: number;
  isShowcase?: boolean;
  showcasePhone?: string;
  showcaseTelegram?: string;
}

export interface ListingContact {
  sellerId: string;
  phone: string;
  telegram?: string;
  updatedAtMs?: number;
}

export interface ListingInquiry {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  offerUsd: number;
  message: string;
  status: InquiryStatus;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  city?: string;
}

export const BRAND_OPTIONS = [
  'Chevrolet',
  'BYD',
  'Kia',
  'Hyundai',
  'Toyota',
  'Chery',
  'Li Auto',
  'Zeekr',
  'Jetour',
  'Boshqa',
] as const;

export const CITY_OPTIONS = [
  'Toshkent',
  'Samarqand',
  'Buxoro',
  "Farg'ona",
  'Andijon',
  'Namangan',
  'Nukus',
  'Qarshi',
  'Urganch',
  'Navoiy',
] as const;

export const FUEL_OPTIONS: FuelType[] = ['Benzin', 'Gibrid', 'Elektromobil', 'Gaz-Benzin', 'Dizel'];
export const TRANSMISSION_OPTIONS: Transmission[] = ['Avtomat', 'Mexanika', 'Variator', 'Robot'];
export const BODY_OPTIONS: BodyStyle[] = ['Sedan', 'Krossover', 'Fastbek', 'Xetchbek', "Yo'ltanlamas"];
export const CONDITION_OPTIONS: CarCondition[] = ['Minilgan', 'Yangi'];

export const PRESET_STUDIOS: { key: PresetKey; label: string; paintHex: string }[] = [
  { key: 'white_sedan', label: 'Oq Sedan', paintHex: '#F4F4F5' },
  { key: 'grey_suv', label: 'Kulrang Krossover', paintHex: '#71717A' },
  { key: 'black_fastback', label: 'Qora Fastbek', paintHex: '#18181B' },
  { key: 'silver_camry', label: 'Kumush Sedan', paintHex: '#D4D4D8' },
  { key: 'emerald_suv', label: 'Zumrad Krossover', paintHex: '#334155' },
  { key: 'slate_crossover', label: "Ko'k-kulrang SUV", paintHex: '#1E3A8A' },
];

export const VALIDATION_LIMITS = {
  idPattern: /^[a-zA-Z0-9_-]+$/,
  phonePattern: /^\+998[0-9]{9}$/,
  optionalPhonePattern: /^(\+998[0-9]{9})?$/,
  brandMax: 40,
  modelMax: 60,
  colorMax: 32,
  cityMax: 48,
  sellerNameMax: 80,
  descriptionMin: 10,
  descriptionMax: 1200,
  imageUrlMax: 240000,
  telegramMax: 48,
  messageMin: 3,
  messageMax: 500,
  yearMin: 1970,
  yearMax: 2027,
  priceMin: 500,
  priceMax: 1000000,
  mileageMin: 0,
  mileageMax: 1500000,
} as const;

export function formatUsd(amount: number): string {
  return '$' + amount.toLocaleString('uz-UZ').replace(/,/g, ' ');
}

export function formatKm(km: number): string {
  if (km === 0) return '0 km';
  return km.toLocaleString('uz-UZ').replace(/,/g, ' ') + ' km';
}
