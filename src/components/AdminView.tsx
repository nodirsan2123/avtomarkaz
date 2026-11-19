import { CheckCircle2, Eye, RotateCcw, Search, Shield, Trash2, UserPlus } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  adminToggleListingStatus,
  deleteCarListing,
  grantAdminRole,
  revokeAdminRole,
  subscribeToAdmins,
} from '../services/listingsService';
import { AdminRole, CarListing, formatKm, formatUsd } from '../types/car';

interface AdminViewProps {
  listings: CarListing[];
  onSelectCar: (car: CarListing) => void;
}

export function AdminView({ listings, onSelectCar }: AdminViewProps) {
  const { user, isAdmin, authLoading, signInWithGoogle } = useAuth();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [admins, setAdmins] = useState<AdminRole[]>([]);
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminNote, setNewAdminNote] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isAdmin) {
      setAdmins([]);
      return;
    }
    return subscribeToAdmins(setAdmins);
  }, [user, isAdmin]);

  const stats = useMemo(() => {
    const active = listings.filter((c) => c.status === 'active');
    const sold = listings.filter((c) => c.status === 'sold');
    const totalValueUsd = active.reduce((acc, c) => acc + c.priceUsd, 0);
    return {
      total: listings.length,
      activeCount: active.length,
      soldCount: sold.length,
      totalValueUsd,
    };
  }, [listings]);

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((car) => {
      if (statusFilter !== 'all' && car.status !== statusFilter) return false;
      if (q) {
        const hay = `${car.brand} ${car.model} ${car.sellerName} ${car.city} ${car.year}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [listings, statusFilter, search]);

  const handleToggleStatus = async (car: CarListing) => {
    setBusyId(car.id);
    try {
      await adminToggleListingStatus(
        car.id,
        car.status === 'active' ? 'sold' : 'active'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (listingId: string) => {
    setBusyId(listingId);
    try {
      await deleteCarListing(listingId);
      setConfirmDeleteId(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);
    try {
      await grantAdminRole(newAdminUid, newAdminNote);
      setNewAdminUid('');
      setNewAdminNote('');
      setAdminSuccess("Admin huquqi muvaffaqiyatli qo'shildi.");
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  };

  if (!user) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-lg mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            Admin boshqaruv paneli
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Ushbu bo&apos;limga kirish uchun administrator hisobi bilan tizimga kiring.
          </p>
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

  if (!isAdmin) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-lg mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-3">
          <Shield className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto" />
          <h2 className="font-display text-xl font-bold text-zinc-950 dark:text-zinc-50">
            Ruxsat cheklangan
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sizning hisobingizda ({user.email}) administrator huquqlari mavjud emas.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Administrator paneli · {user.email}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-zinc-50 mt-1">
            E&apos;lonlar moderatsiyasi va boshqaruv
          </h1>
        </div>
      </div>

      {/* 4-column KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Bazadagi e&apos;lonlar</div>
          <div className="font-mono-num text-2xl font-bold text-zinc-950 dark:text-zinc-50 mt-1">
            {stats.total}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Faol e&apos;lonlar</div>
          <div className="font-mono-num text-2xl font-bold text-zinc-950 dark:text-zinc-50 mt-1">
            {stats.activeCount}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Sotilganlar</div>
          <div className="font-mono-num text-2xl font-bold text-zinc-950 dark:text-zinc-50 mt-1">
            {stats.soldCount}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Faol takliflar hajmi</div>
          <div className="font-mono-num text-2xl font-bold text-zinc-950 dark:text-zinc-50 mt-1">
            {formatUsd(stats.totalValueUsd)}
          </div>
        </div>
      </div>

      {/* Moderation Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit">
            {(['all', 'active', 'sold'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                {status === 'all' ? 'Barchasi' : status === 'active' ? 'Faol' : 'Sotilgan'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-lg sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Avtomobil yoki sotuvchi qidirish..."
              className="w-full text-xs bg-transparent text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Bazadagi foydalanuvchi e&apos;lonlari topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
                  <th className="py-3.5 px-5 font-medium">Avtomobil</th>
                  <th className="py-3.5 px-4 font-medium">Sotuvchi</th>
                  <th className="py-3.5 px-4 font-medium">Shahar</th>
                  <th className="py-3.5 px-4 font-medium">Narxi</th>
                  <th className="py-3.5 px-4 font-medium">Holati</th>
                  <th className="py-3.5 px-5 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {filteredListings.map((car) => {
                  const isBusy = busyId === car.id;
                  const isConfirming = confirmDeleteId === car.id;
                  return (
                    <tr
                      key={car.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="font-medium text-zinc-950 dark:text-zinc-100">
                          {car.year} {car.brand} {car.model}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono-num">
                          {formatKm(car.mileageKm)} · {car.fuelType}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-zinc-700 dark:text-zinc-300">
                        {car.sellerName}
                      </td>
                      <td className="py-4 px-4 text-xs text-zinc-600 dark:text-zinc-400">
                        {car.city}
                      </td>
                      <td className="py-4 px-4 font-mono-num font-semibold text-zinc-950 dark:text-zinc-100">
                        {formatUsd(car.priceUsd)}
                      </td>
                      <td className="py-4 px-4 text-xs">
                        <span
                          className={`font-medium ${
                            car.status === 'active'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {car.status === 'active' ? 'Faol' : 'Sotilgan'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleDelete(car.id)}
                              className="px-2.5 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-medium rounded-md cursor-pointer"
                            >
                              Tasdiqlash
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-md cursor-pointer"
                            >
                              Bekor
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectCar(car)}
                              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer"
                              title="Ko'rish"
                              aria-label="Ko'rish"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleToggleStatus(car)}
                              className="px-2.5 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {car.status === 'active' ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Sotildi</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Faollashtirish</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(car.id)}
                              className="p-2 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-lg transition-colors cursor-pointer"
                              title="O'chirish"
                              aria-label="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Access Management */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Admin huquqlarini boshqarish
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Boshqa moderator foydalanuvchining Firebase UID identifikatorini qo&apos;shing.
          </p>
        </div>

        <form
          onSubmit={handleGrantAdmin}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Foydalanuvchi UID
            </label>
            <input
              type="text"
              value={newAdminUid}
              onChange={(e) => setNewAdminUid(e.target.value)}
              placeholder="Masalan: aBc123XyZ..."
              className="w-full px-3 min-h-[40px] text-xs font-mono-num bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-700"
              required
            />
          </div>
          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              maxLength={120}
              value={newAdminNote}
              onChange={(e) => setNewAdminNote(e.target.value)}
              placeholder="Moderator ismi yoki bo'limi"
              className="w-full px-3 min-h-[40px] text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full min-h-[40px] px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Qo&apos;shish</span>
            </button>
          </div>
        </form>

        {adminError && <p className="text-xs text-red-600 dark:text-red-400">{adminError}</p>}
        {adminSuccess && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{adminSuccess}</p>
        )}

        {admins.length > 0 && (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border-t border-zinc-200 dark:border-zinc-800 pt-2">
            {admins.map((item) => (
              <div
                key={item.uid}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-mono-num font-medium text-zinc-900 dark:text-zinc-100">
                    {item.uid}
                  </span>
                  {item.note && (
                    <span className="text-zinc-500 dark:text-zinc-400 ml-2">
                      · {item.note}
                    </span>
                  )}
                </div>
                {item.uid !== user.uid && (
                  <button
                    type="button"
                    onClick={() => void revokeAdminRole(item.uid)}
                    className="text-red-700 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    Olib tashlash
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
