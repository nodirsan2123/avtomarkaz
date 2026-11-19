import { LogOut, Plus, Settings } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToListingInquiriesForSeller,
  updateInquiryStatus,
} from '../services/listingsService';
import {
  CarListing,
  CITY_OPTIONS,
  formatUsd,
  ListingInquiry,
  VALIDATION_LIMITS,
} from '../types/car';
import { CarCard } from './CarCard';

interface MyListingsViewProps {
  myListings: CarListing[];
  favoriteIds: Set<string>;
  onToggleSave: (car: CarListing) => void;
  onSelectCar: (car: CarListing) => void;
  onOpenCreate: () => void;
}

export function MyListingsView({
  myListings,
  favoriteIds,
  onToggleSave,
  onSelectCar,
  onOpenCreate,
}: MyListingsViewProps) {
  const {
    user,
    profile,
    authLoading,
    authError,
    signInWithGoogle,
    signOut,
    updateProfileDetails,
  } = useAuth();

  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState(profile?.city || 'Toshkent');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [inquiriesByListing, setInquiriesByListing] = useState<
    Record<string, ListingInquiry[]>
  >({});

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setPhone(profile.phone || '');
      setCity(profile.city || 'Toshkent');
    }
  }, [profile]);

  useEffect(() => {
    if (!user || myListings.length === 0) {
      setInquiriesByListing({});
      return;
    }

    const unsubscribers = myListings.map((listing) =>
      subscribeToListingInquiriesForSeller(listing.id, user.uid, (items) => {
        setInquiriesByListing((prev) => ({
          ...prev,
          [listing.id]: items,
        }));
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [user, myListings]);

  const allInquiries = Object.values(inquiriesByListing)
    .flat()
    .sort((a, b) => b.createdAtMs - a.createdAtMs);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    if (!displayName.trim()) {
      setProfileError("Ism kiritilishi shart");
      return;
    }
    if (phone.trim() && !VALIDATION_LIMITS.optionalPhonePattern.test(phone.trim())) {
      setProfileError("Telefon +998901234567 formatida bo'lishi kerak");
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfileDetails({
        displayName: displayName.trim(),
        phone: phone.trim(),
        city,
      });
      setProfileSaved(true);
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setProfileSaving(false);
    }
  };

  if (!user) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-lg mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            Shaxsiy kabinet
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            O&apos;z avtomobil e&apos;lonlaringizni joylashtirish, narxlarni yangilash
            va xaridorlardan kelgan takliflarni ko&apos;rish uchun hisobingizga kiring.
          </p>
          {authError && (
            <p className="text-xs text-red-600 dark:text-red-400">{authError}</p>
          )}
          <button
            type="button"
            disabled={authLoading}
            onClick={() => void signInWithGoogle()}
            className="min-h-[44px] px-6 py-2.5 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            {authLoading ? 'Kirilmoqda...' : 'Google bilan kirish'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Account Summary Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Sotuvchi profili</div>
            <h2 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50 mt-1">
              {profile?.displayName || user.displayName || 'Foydalanuvchi'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {user.email}
              {profile?.city ? ` · ${profile.city}` : ''}
              {profile?.phone ? ` · ${profile.phone}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setEditingProfile((prev) => !prev);
                setProfileSaved(false);
              }}
              className="min-h-[40px] px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-800 dark:text-zinc-200 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Profilni sozlash</span>
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="min-h-[40px] px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>

        {profileSaved && (
          <p className="mt-4 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            Profil ma&apos;lumotlari yangilandi.
          </p>
        )}

        {editingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Ism
              </label>
              <input
                type="text"
                maxLength={VALIDATION_LIMITS.sellerNameMax}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 min-h-[40px] text-sm bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Telefon (+998901234567)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998901234567"
                className="w-full px-3 min-h-[40px] text-sm font-mono-num bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Shahar
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 min-h-[40px] text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                {CITY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="min-h-[40px] px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {profileSaving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>

            {profileError && (
              <p className="sm:col-span-4 text-xs text-red-600 dark:text-red-400">{profileError}</p>
            )}
          </form>
        )}
      </div>

      {/* My Listings Grid */}
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Mening e&apos;lonlarim ({myListings.length})
          </h3>
          <button
            type="button"
            onClick={onOpenCreate}
            className="min-h-[40px] px-4 py-2 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi e&apos;lon</span>
          </button>
        </div>

        {myListings.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            <h4 className="font-display text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Hozircha e&apos;lonlaringiz yo&apos;q
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Birinchi avtomobilingizni joylang — u darhol barcha xaridorlarga
              ko&apos;rinadi.
            </p>
            <button
              type="button"
              onClick={onOpenCreate}
              className="mt-2 min-h-[44px] px-5 py-2.5 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              E&apos;lon joylash
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                isSaved={favoriteIds.has(car.id)}
                onToggleSave={onToggleSave}
                onSelect={onSelectCar}
              />
            ))}
          </div>
        )}
      </div>

      {/* Incoming Buyer Offers */}
      <div className="space-y-4">
        <h3 className="font-display text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          Kelgan takliflar ({allInquiries.length})
        </h3>
        {allInquiries.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-sm text-zinc-500 dark:text-zinc-400">
            Xaridorlardan kelgan narx takliflari va xabarlar shu yerda ko&apos;rinadi.
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-200 dark:divide-zinc-800">
            {allInquiries.map((inq) => (
              <div
                key={inq.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {inq.listingTitle} · <span className="font-medium text-zinc-800 dark:text-zinc-200">{inq.buyerName}</span> ·{' '}
                    <span className="font-mono-num">{inq.buyerPhone}</span>
                  </div>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{inq.message}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="font-mono-num text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    {formatUsd(inq.offerUsd)}
                  </div>
                  {inq.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateInquiryStatus(inq.listingId, inq.id, 'accepted')
                        }
                        className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-medium rounded-lg cursor-pointer"
                      >
                        Qabul qilish
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateInquiryStatus(inq.listingId, inq.id, 'declined')
                        }
                        className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg cursor-pointer"
                      >
                        Rad etish
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`text-xs font-medium ${
                        inq.status === 'accepted'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-zinc-500 dark:text-zinc-400'
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
    </section>
  );
}
