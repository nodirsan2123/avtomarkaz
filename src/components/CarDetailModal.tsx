import {
  Bookmark,
  Check,
  Edit3,
  MessageSquare,
  Phone,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  deleteCarListing,
  fetchListingContact,
  markListingAsSold,
  submitListingInquiry,
  subscribeToBuyerInquiriesForListing,
  subscribeToListingInquiriesForSeller,
  updateInquiryStatus,
} from '../services/listingsService';
import {
  CarListing,
  formatKm,
  formatUsd,
  ListingContact,
  ListingInquiry,
  VALIDATION_LIMITS,
} from '../types/car';
import { CarVisual } from './CarVisual';

interface CarDetailModalProps {
  car: CarListing;
  isSaved: boolean;
  onToggleSave: (car: CarListing) => void;
  onClose: () => void;
  onEdit: (car: CarListing) => void;
}

export function CarDetailModal({
  car,
  isSaved,
  onToggleSave,
  onClose,
  onEdit,
}: CarDetailModalProps) {
  const { user, profile, signInWithGoogle } = useAuth();
  const isOwner = Boolean(user && !car.isShowcase && user.uid === car.sellerId);
  const isSold = car.status === 'sold';

  const [contact, setContact] = useState<ListingContact | null>(null);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSold, setConfirmSold] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Buyer inquiry state
  const [offerUsd, setOfferUsd] = useState<string>(String(car.priceUsd));
  const [buyerPhone, setBuyerPhone] = useState<string>(profile?.phone || '+998');
  const [message, setMessage] = useState<string>('');
  const [inquiryBusy, setInquiryBusy] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquirySent, setInquirySent] = useState(false);

  // Inquiries lists
  const [sellerInquiries, setSellerInquiries] = useState<ListingInquiry[]>([]);
  const [buyerInquiries, setBuyerInquiries] = useState<ListingInquiry[]>([]);

  useEffect(() => {
    setOfferUsd(String(car.priceUsd));
    setBuyerPhone(profile?.phone || '+998');
    setShowPhone(false);
    setContact(null);
    setContactError(null);
    setConfirmDelete(false);
    setConfirmSold(false);
    setInquirySent(false);
    setInquiryError(null);
  }, [car.id, car.priceUsd, profile?.phone]);

  useEffect(() => {
    if (car.isShowcase || !user) return;
    if (isOwner) {
      return subscribeToListingInquiriesForSeller(car.id, user.uid, setSellerInquiries);
    }
    return subscribeToBuyerInquiriesForListing(car.id, user.uid, setBuyerInquiries);
  }, [car.id, car.isShowcase, isOwner, user]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleRevealContact = async () => {
    if (car.isShowcase) {
      setContact({
        sellerId: car.sellerId,
        phone: car.showcasePhone || '+998901234567',
        telegram: car.showcaseTelegram,
      });
      setShowPhone(true);
      return;
    }

    let currentUser = user;
    if (!currentUser) {
      currentUser = await signInWithGoogle();
      if (!currentUser) return;
    }

    setContactLoading(true);
    setContactError(null);
    try {
      const data = await fetchListingContact(car.id);
      if (data) {
        setContact(data);
        setShowPhone(true);
      } else {
        setContactError("Aloqa ma'lumotlari topilmadi.");
      }
    } catch {
      setContactError("Aloqa ma'lumotlarini yuklashda xatolik.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleMarkSold = async () => {
    setActionBusy(true);
    try {
      await markListingAsSold(car.id);
      setConfirmSold(false);
      onClose();
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async () => {
    setActionBusy(true);
    try {
      await deleteCarListing(car.id);
      onClose();
    } finally {
      setActionBusy(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError(null);
    setInquirySent(false);

    if (car.isShowcase) {
      setInquiryError(
        "Bu namunaviy e'lon. Haqiqiy taklif yuborish uchun foydalanuvchi tomonidan joylangan e'lonni tanlang."
      );
      return;
    }

    let currentUser = user;
    if (!currentUser) {
      currentUser = await signInWithGoogle();
      if (!currentUser) return;
    }

    const numericOffer = Number(offerUsd);
    if (
      !Number.isFinite(numericOffer) ||
      numericOffer < VALIDATION_LIMITS.priceMin ||
      numericOffer > VALIDATION_LIMITS.priceMax
    ) {
      setInquiryError(
        `Taklif narxi $${VALIDATION_LIMITS.priceMin} dan $${VALIDATION_LIMITS.priceMax.toLocaleString()} gacha bo'lishi kerak`
      );
      return;
    }
    if (!VALIDATION_LIMITS.phonePattern.test(buyerPhone.trim())) {
      setInquiryError("Telefon raqami +998901234567 formatida bo'lishi kerak");
      return;
    }
    if (message.trim().length < VALIDATION_LIMITS.messageMin) {
      setInquiryError("Xabar kamida 3 ta belgidan iborat bo'lishi kerak");
      return;
    }

    setInquiryBusy(true);
    try {
      await submitListingInquiry({
        listing: car,
        buyerId: currentUser.uid,
        buyerName: profile?.displayName || currentUser.displayName || 'Xaridor',
        buyerPhone: buyerPhone.trim(),
        offerUsd: Math.round(numericOffer),
        message: message.trim(),
      });
      setMessage('');
      setInquirySent(true);
    } catch (err) {
      setInquiryError(
        err instanceof Error ? err.message : 'Taklif yuborishda xatolik yuz berdi'
      );
    } finally {
      setInquiryBusy(false);
    }
  };

  const specs = [
    { label: 'Yili', value: String(car.year), mono: true },
    { label: 'Yurgan masofa', value: formatKm(car.mileageKm), mono: true },
    { label: "Yoqilg'i turi", value: car.fuelType, mono: false },
    { label: 'Uzatma qutisi', value: car.transmission, mono: false },
    { label: 'Kuzov turi', value: car.bodyStyle, mono: false },
    { label: 'Rangi', value: car.color, mono: false },
    { label: 'Holati', value: car.condition, mono: false },
    { label: 'Shahar', value: car.city, mono: false },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto p-4 sm:p-6 flex items-start justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${car.year} ${car.brand} ${car.model}`}
    >
      <div
        className="relative w-full max-w-4xl bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xl my-4 sm:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar inside modal */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 truncate">
            <span>{car.brand}</span>
            <span aria-hidden="true">/</span>
            <span>{car.model}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">{car.year}</span>
            {car.isShowcase && (
              <>
                <span aria-hidden="true">·</span>
                <span>Namuna e&apos;lon</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column PDP Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Gallery & Tech Specs */}
          <div className="lg:col-span-6 p-6 border-b lg:border-b-0 lg:border-r border-zinc-200 space-y-6">
            <div className="h-56 sm:h-64 w-full rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100">
              <CarVisual
                imageUrl={car.imageUrl}
                presetKey={car.presetKey}
                alt={`${car.year} ${car.brand} ${car.model}`}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-950 mb-3">
                Texnik ko&apos;rsatkichlar
              </h3>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 border-t border-b border-zinc-200 py-4">
                {specs.map((spec) => (
                  <div key={spec.label}>
                    <dt className="text-xs text-zinc-500">{spec.label}</dt>
                    <dd
                      className={`mt-1 text-sm font-medium text-zinc-950 ${
                        spec.mono ? 'font-mono-num' : ''
                      }`}
                    >
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-950 mb-2">
                Sotuvchi izohi
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                {car.description}
              </p>
            </div>
          </div>

          {/* Right: Contiguous Purchase / Contact Module */}
          <div className="lg:col-span-6 p-6 bg-zinc-50/50 flex flex-col gap-5">
            <div>
              {isSold && (
                <p className="text-xs font-semibold text-amber-700 mb-2">
                  Sotilgan avtomobil
                </p>
              )}
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 leading-tight [text-wrap:balance]">
                {car.year} {car.brand} {car.model}
              </h2>
              <div className="mt-3 font-mono-num text-3xl font-bold text-zinc-950">
                {formatUsd(car.priceUsd)}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Sotuvchi: <span className="font-medium text-zinc-800">{car.sellerName}</span> · {car.city}
              </p>
            </div>

            {/* Primary Actions */}
            <div className="space-y-3">
              {!isOwner && (
                <>
                  {showPhone && contact ? (
                    <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-2">
                      <div className="text-xs text-zinc-500">Sotuvchi telefoni</div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="font-mono-num text-lg font-semibold text-blue-700 hover:underline block"
                      >
                        {contact.phone}
                      </a>
                      {contact.telegram && (
                        <div className="text-xs text-zinc-600 pt-1">
                          Telegram: <span className="font-medium text-zinc-900">{contact.telegram}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRevealContact}
                      disabled={contactLoading}
                      className="w-full min-h-[44px] px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>
                        {contactLoading
                          ? 'Yuklanmoqda...'
                          : !user && !car.isShowcase
                          ? "Raqamni ko'rish (Google bilan kirish)"
                          : "Sotuvchi raqamini ko'rish"}
                      </span>
                    </button>
                  )}

                  {contactError && (
                    <p className="text-xs text-red-600">{contactError}</p>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => onToggleSave(car)}
                className={`w-full min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-lg border inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span>{isSaved ? 'Saqlanganlarda' : 'Saqlab qo‘yish'}</span>
              </button>
            </div>

            {/* Owner Management Controls */}
            {isOwner && (
              <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-zinc-900">
                  E&apos;lonni boshqarish
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isSold && (
                    <button
                      type="button"
                      onClick={() => onEdit(car)}
                      className="flex-1 min-h-[40px] px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Tahrirlash</span>
                    </button>
                  )}

                  {!isSold && !confirmSold && (
                    <button
                      type="button"
                      onClick={() => setConfirmSold(true)}
                      className="flex-1 min-h-[40px] px-3 py-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Sotildi</span>
                    </button>
                  )}

                  {!confirmDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="min-h-[40px] px-3 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>O&apos;chirish</span>
                    </button>
                  )}
                </div>

                {confirmSold && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                    <p className="text-xs text-amber-900">
                      Avtomobilni sotilgan deb belgilaysizmi? Keyin tahrirlab bo&apos;lmaydi.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={handleMarkSold}
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-md cursor-pointer"
                      >
                        Ha, sotildi
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmSold(false)}
                        className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-medium rounded-md cursor-pointer"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}

                {confirmDelete && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                    <p className="text-xs text-red-900">
                      E&apos;lonni butunlay o&apos;chirishni tasdiqlaysizmi?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={handleDelete}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-medium rounded-md cursor-pointer"
                      >
                        O&apos;chirish
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-medium rounded-md cursor-pointer"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Seller Incoming Inquiries */}
            {isOwner && (
              <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-950">
                    Xaridorlar takliflari ({sellerInquiries.length})
                  </h4>
                </div>
                {sellerInquiries.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    Hozircha bu avtomobil uchun takliflar kelib tushmagan.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {sellerInquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-zinc-950">
                            {inq.buyerName}
                          </span>
                          <span className="font-mono-num text-xs font-semibold text-blue-700">
                            {formatUsd(inq.offerUsd)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600">{inq.message}</p>
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span className="font-mono-num">{inq.buyerPhone}</span>
                          {inq.status === 'pending' ? (
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateInquiryStatus(car.id, inq.id, 'accepted')
                                }
                                className="px-2.5 py-1 bg-zinc-900 text-white rounded text-xs cursor-pointer"
                              >
                                Qabul
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateInquiryStatus(car.id, inq.id, 'declined')
                                }
                                className="px-2.5 py-1 bg-white border border-zinc-200 text-zinc-700 rounded text-xs cursor-pointer"
                              >
                                Rad
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`font-medium ${
                                inq.status === 'accepted'
                                  ? 'text-emerald-700'
                                  : 'text-zinc-500'
                              }`}
                            >
                              {inq.status === 'accepted' ? 'Qabul qilindi' : 'Rad etildi'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Buyer Offer Form (for non-owners on active listings) */}
            {!isOwner && !isSold && !car.isShowcase && (
              <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-950">
                  <MessageSquare className="w-4 h-4 text-zinc-500" />
                  <span>Sotuvchiga taklif yuborish</span>
                </div>

                <form onSubmit={handleInquirySubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Taklif ($)
                      </label>
                      <input
                        type="number"
                        min={VALIDATION_LIMITS.priceMin}
                        max={VALIDATION_LIMITS.priceMax}
                        value={offerUsd}
                        onChange={(e) => setOfferUsd(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono-num border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">
                        Telefoningiz
                      </label>
                      <input
                        type="tel"
                        placeholder="+998901234567"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono-num border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">
                      Xabar
                    </label>
                    <textarea
                      rows={2}
                      maxLength={VALIDATION_LIMITS.messageMax}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Mashina holati va ko'rish vaqti haqida yozing..."
                      className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
                      required
                    />
                  </div>

                  {inquiryError && (
                    <p className="text-xs text-red-600">{inquiryError}</p>
                  )}
                  {inquirySent && (
                    <p className="text-xs text-emerald-700 font-medium">
                      Taklifingiz sotuvchiga yuborildi.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={inquiryBusy}
                    className="w-full min-h-[40px] px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white text-xs font-medium rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{inquiryBusy ? 'Yuborilmoqda...' : 'Taklif yuborish'}</span>
                  </button>
                </form>

                {buyerInquiries.length > 0 && (
                  <div className="pt-3 border-t border-zinc-100 space-y-2">
                    <div className="text-xs font-medium text-zinc-700">
                      Yuborilgan takliflaringiz
                    </div>
                    {buyerInquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="flex items-center justify-between text-xs text-zinc-600 bg-zinc-50 px-2.5 py-2 rounded-lg"
                      >
                        <span className="font-mono-num font-medium text-zinc-950">
                          {formatUsd(inq.offerUsd)}
                        </span>
                        <span
                          className={
                            inq.status === 'accepted'
                              ? 'text-emerald-700 font-medium'
                              : inq.status === 'declined'
                              ? 'text-red-600 font-medium'
                              : 'text-zinc-500'
                          }
                        >
                          {inq.status === 'accepted'
                            ? 'Qabul qilindi'
                            : inq.status === 'declined'
                            ? 'Rad etildi'
                            : 'Kutilmoqda'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
