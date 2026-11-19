import { ImagePlus, Upload, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  compressCarImageFile,
  createCarListing,
  fetchListingContact,
  updateCarListing,
} from '../services/listingsService';
import {
  BODY_OPTIONS,
  BodyStyle,
  BRAND_OPTIONS,
  CarCondition,
  CarListing,
  CITY_OPTIONS,
  CONDITION_OPTIONS,
  FUEL_OPTIONS,
  FuelType,
  PRESET_STUDIOS,
  PresetKey,
  TRANSMISSION_OPTIONS,
  Transmission,
  VALIDATION_LIMITS,
} from '../types/car';
import { CarVisual } from './CarVisual';

interface CreateListingModalProps {
  editingCar?: CarListing | null;
  onClose: () => void;
  onSaved: (listingId?: string) => void;
}

export function CreateListingModal({
  editingCar,
  onClose,
  onSaved,
}: CreateListingModalProps) {
  const { user, profile, signInWithGoogle, authLoading } = useAuth();
  const isEditing = Boolean(editingCar);

  const [brand, setBrand] = useState<string>(editingCar?.brand || 'Chevrolet');
  const [model, setModel] = useState<string>(editingCar?.model || '');
  const [year, setYear] = useState<string>(String(editingCar?.year || 2024));
  const [priceUsd, setPriceUsd] = useState<string>(
    editingCar ? String(editingCar.priceUsd) : ''
  );
  const [mileageKm, setMileageKm] = useState<string>(
    editingCar ? String(editingCar.mileageKm) : '0'
  );
  const [condition, setCondition] = useState<CarCondition>(
    editingCar?.condition || 'Minilgan'
  );
  const [fuelType, setFuelType] = useState<FuelType>(
    editingCar?.fuelType || 'Benzin'
  );
  const [transmission, setTransmission] = useState<Transmission>(
    editingCar?.transmission || 'Avtomat'
  );
  const [bodyStyle, setBodyStyle] = useState<BodyStyle>(
    editingCar?.bodyStyle || 'Sedan'
  );
  const [color, setColor] = useState<string>(editingCar?.color || 'Oq');
  const [city, setCity] = useState<string>(
    editingCar?.city || profile?.city || 'Toshkent'
  );
  const [description, setDescription] = useState<string>(
    editingCar?.description || ''
  );
  const [presetKey, setPresetKey] = useState<PresetKey>(
    editingCar?.presetKey || 'white_sedan'
  );
  const [imageUrl, setImageUrl] = useState<string>(editingCar?.imageUrl || '');
  const [imageMode, setImageMode] = useState<'preset' | 'upload' | 'url'>(
    editingCar?.imageUrl
      ? editingCar.imageUrl.startsWith('data:')
        ? 'upload'
        : 'url'
      : 'preset'
  );
  const [phone, setPhone] = useState<string>(profile?.phone || '+998');
  const [telegram, setTelegram] = useState<string>('');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingCar) {
      void fetchListingContact(editingCar.id).then((contact) => {
        if (contact) {
          setPhone(contact.phone);
          setTelegram(contact.telegram || '');
        }
      });
    }
  }, [editingCar]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingImage(true);
    try {
      const compressed = await compressCarImageFile(file);
      setImageUrl(compressed);
      setImageMode('upload');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Rasmni yuklashda xatolik yuz berdi"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      await signInWithGoogle();
      return;
    }

    const numYear = Number(year);
    const numPrice = Number(priceUsd);
    const numMileage = Number(mileageKm);

    if (!model.trim()) {
      setError('Avtomobil modelini kiriting');
      return;
    }
    if (
      !Number.isFinite(numYear) ||
      numYear < VALIDATION_LIMITS.yearMin ||
      numYear > VALIDATION_LIMITS.yearMax
    ) {
      setError(
        `Ishlab chiqarilgan yili ${VALIDATION_LIMITS.yearMin}–${VALIDATION_LIMITS.yearMax} oralig'ida bo'lishi kerak`
      );
      return;
    }
    if (
      !Number.isFinite(numPrice) ||
      numPrice < VALIDATION_LIMITS.priceMin ||
      numPrice > VALIDATION_LIMITS.priceMax
    ) {
      setError(
        `Narxi $${VALIDATION_LIMITS.priceMin} dan $${VALIDATION_LIMITS.priceMax.toLocaleString()} gacha bo'lishi kerak`
      );
      return;
    }
    if (
      !Number.isFinite(numMileage) ||
      numMileage < VALIDATION_LIMITS.mileageMin ||
      numMileage > VALIDATION_LIMITS.mileageMax
    ) {
      setError("Yurgan masofa noto'g'ri kiritilgan");
      return;
    }
    if (description.trim().length < VALIDATION_LIMITS.descriptionMin) {
      setError(
        `Tavsif kamida ${VALIDATION_LIMITS.descriptionMin} ta belgidan iborat bo'lishi kerak`
      );
      return;
    }
    if (!VALIDATION_LIMITS.phonePattern.test(phone.trim())) {
      setError("Telefon raqami +998901234567 formatida bo'lishi kerak");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        brand,
        model: model.trim(),
        year: Math.round(numYear),
        priceUsd: Math.round(numPrice),
        mileageKm: condition === 'Yangi' ? 0 : Math.round(numMileage),
        fuelType,
        transmission,
        bodyStyle,
        color: color.trim() || 'Oq',
        condition,
        city,
        description: description.trim(),
        imageUrl: imageMode === 'preset' ? '' : imageUrl.trim(),
        presetKey,
        phone: phone.trim(),
        telegram: telegram.trim(),
      };

      if (editingCar) {
        await updateCarListing(editingCar.id, user.uid, payload);
        onSaved(editingCar.id);
      } else {
        const newId = await createCarListing(
          user.uid,
          profile?.displayName || user.displayName || 'Sotuvchi',
          payload
        );
        onSaved(newId);
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "E'lonni saqlashda xatolik yuz berdi"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex items-start justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? "E'lonni tahrirlash" : "Yangi e'lon joylash"}
    >
      <div
        className="w-full max-w-3xl bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xl my-4 sm:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-zinc-950">
            {isEditing ? "E'lonni tahrirlash" : "Yangi avtomobil e'loni joylash"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div className="p-8 text-center space-y-4">
            <h3 className="font-display text-xl font-semibold text-zinc-950">
              E&apos;lon joylash uchun hisobga kiring
            </h3>
            <p className="text-sm text-zinc-600 max-w-md mx-auto">
              E&apos;lonlaringizni boshqarish, narxlarni tahrirlash va xaridorlar
              takliflarini qabul qilish uchun Google hisobingiz bilan kiring.
            </p>
            <button
              type="button"
              disabled={authLoading}
              onClick={() => void signInWithGoogle()}
              className="min-h-[44px] px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {authLoading ? 'Kirilmoqda...' : 'Google bilan kirish'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Image Picker & Preview */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-6 border-b border-zinc-200">
              <div className="md:col-span-4 h-44 w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100">
                <CarVisual
                  imageUrl={imageMode === 'preset' ? '' : imageUrl}
                  presetKey={presetKey}
                  alt="Avtomobil ko'rinishi"
                />
              </div>

              <div className="md:col-span-8 space-y-3">
                <div className="text-xs font-semibold text-zinc-900">
                  Avtomobil rasmi
                </div>

                <div className="flex flex-wrap gap-1 p-1 bg-zinc-100 rounded-lg w-fit">
                  <button
                    type="button"
                    onClick={() => setImageMode('preset')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      imageMode === 'preset'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Studiya andozasi
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      imageMode === 'upload'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Qurilmadan yuklash
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      imageMode === 'url'
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    Rasm havolasi
                  </button>
                </div>

                {imageMode === 'preset' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_STUDIOS.map((studio) => (
                      <button
                        key={studio.key}
                        type="button"
                        onClick={() => setPresetKey(studio.key)}
                        className={`px-3 py-2 text-xs text-left rounded-lg border transition-colors cursor-pointer flex items-center gap-2 ${
                          presetKey === studio.key
                            ? 'border-blue-700 bg-blue-50 text-blue-900 font-medium'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-zinc-300 shrink-0"
                          style={{ backgroundColor: studio.paintHex }}
                        />
                        <span className="truncate">{studio.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {imageMode === 'upload' && (
                  <label className="flex items-center justify-center gap-2 px-4 py-4 border border-dashed border-zinc-300 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer text-xs text-zinc-700">
                    {uploadingImage ? (
                      <span>Rasm tayyorlanmoqda...</span>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-zinc-500" />
                        <span>JPG yoki PNG rasm tanlang (avtomatik siqiladi)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                )}

                {imageMode === 'url' && (
                  <div className="flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Core Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Marka
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 min-h-[42px] text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  {BRAND_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Model
                </label>
                <input
                  type="text"
                  maxLength={VALIDATION_LIMITS.modelMax}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Malibu 2 XL"
                  className="w-full px-3 min-h-[42px] text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Ishlab chiqarilgan yil
                </label>
                <input
                  type="number"
                  min={VALIDATION_LIMITS.yearMin}
                  max={VALIDATION_LIMITS.yearMax}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 min-h-[42px] text-sm font-mono-num border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Narxi (USD $)
                </label>
                <input
                  type="number"
                  min={VALIDATION_LIMITS.priceMin}
                  max={VALIDATION_LIMITS.priceMax}
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  placeholder="24500"
                  className="w-full px-3 min-h-[42px] text-sm font-mono-num border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Holati
                </label>
                <select
                  value={condition}
                  onChange={(e) => {
                    const val = e.target.value as CarCondition;
                    setCondition(val);
                    if (val === 'Yangi') setMileageKm('0');
                  }}
                  className="w-full px-3 min-h-[42px] text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  {CONDITION_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Yurgani (km)
                </label>
                <input
                  type="number"
                  min={0}
                  max={VALIDATION_LIMITS.mileageMax}
                  disabled={condition === 'Yangi'}
                  value={condition === 'Yangi' ? '0' : mileageKm}
                  onChange={(e) => setMileageKm(e.target.value)}
                  className="w-full px-3 min-h-[42px] text-sm font-mono-num border border-zinc-200 rounded-lg disabled:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Yoqilg&apos;i
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as FuelType)}
                  className="w-full px-3 min-h-[42px] text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  {FUEL_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Uzatma qutisi
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value as Transmission)}
                  className="w-full px-3 min-h-[42px] text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  {TRANSMISSION_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Kuzov turi
                </label>
                <select
                  value={bodyStyle}
                  onChange={(e) => setBodyStyle(e.target.value as BodyStyle)}
                  className="w-full px-3 min-h-[42px] text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  {BODY_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Rangi
                </label>
                <input
                  type="text"
                  maxLength={VALIDATION_LIMITS.colorMax}
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Oq"
                  className="w-full px-3 min-h-[42px] text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  Avtomobil haqida batafsil
                </label>
                <span className="text-xs font-mono-num text-zinc-400">
                  {description.length}/{VALIDATION_LIMITS.descriptionMax}
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={VALIDATION_LIMITS.descriptionMax}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kraska holati, jihozlari, qo'shimcha qulayliklar va savdo shartlari..."
                className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
                required
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Shahar
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 min-h-[42px] text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  {CITY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Telefon (+998901234567)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full px-3 min-h-[42px] text-sm font-mono-num border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Telegram (ixtiyoriy)
                </label>
                <input
                  type="text"
                  maxLength={VALIDATION_LIMITS.telegramMax}
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full px-3 min-h-[42px] text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-5 py-2.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="min-h-[44px] px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {submitting
                  ? 'Saqlanmoqda...'
                  : isEditing
                  ? "O'zgarishlarni saqlash"
                  : "E'lonni joylash"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
