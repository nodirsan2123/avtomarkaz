import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminView } from './components/AdminView';
import { CarCard } from './components/CarCard';
import { CarDetailModal } from './components/CarDetailModal';
import { CreateListingModal } from './components/CreateListingModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MyListingsView } from './components/MyListingsView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SHOWCASE_CARS } from './data/showcaseCars';
import {
  subscribeToFavorites,
  subscribeToListings,
  toggleFavorite,
} from './services/listingsService';
import { CarListing, NavTab, SortOption } from './types/car';

const BRAND_FILTER_TABS = [
  'Barchasi',
  'Chevrolet',
  'BYD',
  'Kia',
  'Hyundai',
  'Toyota',
  'Boshqa',
] as const;

const LOCAL_SAVED_KEY = 'avtomarkaz_saved_ids';

function MarketplaceContent() {
  const { user, isAdmin } = useAuth();

  const [dbListings, setDbListings] = useState<CarListing[]>([]);
  const [listingsLoaded, setListingsLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<NavTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Barchasi');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'Yangi' | 'Minilgan'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const [firestoreFavIds, setFirestoreFavIds] = useState<Set<string>>(new Set());
  const [localFavIds, setLocalFavIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SAVED_KEY);
      if (raw) {
        return new Set(JSON.parse(raw) as string[]);
      }
    } catch {
      // Ignore storage error
    }
    return new Set();
  });

  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarListing | null>(null);

  const catalogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const unsub = subscribeToListings(
      (items) => {
        setDbListings(items);
        setListingsLoaded(true);
      },
      () => {
        setListingsLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setFirestoreFavIds(new Set());
      return;
    }
    return subscribeToFavorites(user.uid, setFirestoreFavIds);
  }, [user]);

  const combinedListings = useMemo(() => {
    return [...dbListings, ...SHOWCASE_CARS];
  }, [dbListings]);

  const favoriteIds = useMemo(() => {
    if (!user) return localFavIds;
    const merged = new Set(firestoreFavIds);
    localFavIds.forEach((id) => {
      if (id.startsWith('showcase-')) {
        merged.add(id);
      }
    });
    return merged;
  }, [user, firestoreFavIds, localFavIds]);

  const myListings = useMemo(() => {
    if (!user) return [];
    return dbListings.filter((car) => car.sellerId === user.uid);
  }, [dbListings, user]);

  const selectedCar = useMemo(() => {
    if (!selectedCarId) return null;
    return combinedListings.find((c) => c.id === selectedCarId) || null;
  }, [combinedListings, selectedCarId]);

  const featuredCar = useMemo(() => {
    const firstActiveDb = dbListings.find((c) => c.status === 'active');
    return firstActiveDb || SHOWCASE_CARS[0];
  }, [dbListings]);

  const handleToggleSave = async (car: CarListing) => {
    const isSaved = favoriteIds.has(car.id);

    if (user && !car.isShowcase) {
      await toggleFavorite(user.uid, car.id, isSaved);
      return;
    }

    setLocalFavIds((prev) => {
      const next = new Set(prev);
      if (next.has(car.id)) {
        next.delete(car.id);
      } else {
        next.add(car.id);
      }
      try {
        localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const filteredCars = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = combinedListings.filter((car) => {
      if (activeTab === 'new' && car.condition !== 'Yangi') return false;
      if (activeTab === 'saved' && !favoriteIds.has(car.id)) return false;
      if (conditionFilter !== 'all' && car.condition !== conditionFilter) return false;
      if (selectedCity && car.city !== selectedCity) return false;

      if (selectedBrand !== 'Barchasi') {
        const coreBrands = ['Chevrolet', 'BYD', 'Kia', 'Hyundai', 'Toyota'];
        if (selectedBrand === 'Boshqa') {
          if (coreBrands.includes(car.brand)) return false;
        } else if (car.brand !== selectedBrand) {
          return false;
        }
      }

      if (q) {
        const haystack =
          `${car.brand} ${car.model} ${car.city} ${car.color} ${car.fuelType} ${car.year}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    const sorted = [...list];
    switch (sortOption) {
      case 'price_asc':
        sorted.sort((a, b) => a.priceUsd - b.priceUsd);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.priceUsd - a.priceUsd);
        break;
      case 'mileage_asc':
        sorted.sort((a, b) => a.mileageKm - b.mileageKm);
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => b.createdAtMs - a.createdAtMs);
        break;
    }

    return sorted;
  }, [
    combinedListings,
    activeTab,
    favoriteIds,
    conditionFilter,
    selectedCity,
    selectedBrand,
    searchQuery,
    sortOption,
  ]);

  const activeListingsCount = useMemo(
    () => combinedListings.filter((c) => c.status === 'active').length,
    [combinedListings]
  );

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'new') {
      setConditionFilter('Yangi');
    } else if (tab === 'all') {
      setConditionFilter('all');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedBrand('Barchasi');
    setConditionFilter('all');
    setSortOption('newest');
    if (activeTab === 'new') {
      setActiveTab('all');
    }
  };

  const scrollToCatalog = () => {
    if (activeTab === 'mine' || activeTab === 'saved' || activeTab === 'admin') {
      setActiveTab('all');
    }
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100">
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenCreate={() => {
          setEditingCar(null);
          setCreateModalOpen(true);
        }}
        savedCount={favoriteIds.size}
        myListingsCount={myListings.length}
        isAdmin={isAdmin}
      />

      <main className="flex-1">
        {activeTab === 'admin' ? (
          <AdminView
            listings={dbListings}
            onSelectCar={(car) => setSelectedCarId(car.id)}
          />
        ) : activeTab === 'mine' ? (
          <MyListingsView
            myListings={myListings}
            favoriteIds={favoriteIds}
            onToggleSave={handleToggleSave}
            onSelectCar={(car) => setSelectedCarId(car.id)}
            onOpenCreate={() => {
              setEditingCar(null);
              setCreateModalOpen(true);
            }}
          />
        ) : (
          <>
            {activeTab !== 'saved' && (
              <HeroSection
                searchQuery={searchQuery}
                selectedCity={selectedCity}
                onSearchQueryChange={setSearchQuery}
                onCityChange={setSelectedCity}
                onSearchSubmit={scrollToCatalog}
                featuredCar={featuredCar}
                onSelectFeatured={(car) => setSelectedCarId(car.id)}
                totalListings={combinedListings.length}
                activeListings={activeListingsCount}
              />
            )}

            {/* Catalog Section */}
            <section
              ref={catalogRef}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6"
            >
              {/* Section Header & Sort Controls */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                    {activeTab === 'saved'
                      ? 'Saqlangan avtomobillar'
                      : activeTab === 'new'
                      ? 'Yangi avtomobillar'
                      : "Barcha e'lonlar"}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Topildi: <span className="font-mono-num font-medium text-zinc-900 dark:text-zinc-100">{filteredCars.length}</span> ta avtomobil
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Condition Segmented Control */}
                  <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                    {(['all', 'Yangi', 'Minilgan'] as const).map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setConditionFilter(cond)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          conditionFilter === cond
                            ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                        }`}
                      >
                        {cond === 'all' ? 'Barchasi' : cond}
                      </button>
                    ))}
                  </div>

                  {/* Sort Select */}
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    aria-label="Saralash"
                    className="px-3 min-h-[38px] text-xs font-medium text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 cursor-pointer"
                  >
                    <option value="newest">Eng yangi</option>
                    <option value="price_asc">Avval arzonroq</option>
                    <option value="price_desc">Avval qimmatroq</option>
                    <option value="mileage_asc">Kam yurgan</option>
                  </select>
                </div>
              </div>

              {/* Brand Filter Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {BRAND_FILTER_TABS.map((brand) => {
                  const isActive = selectedBrand === brand;
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-zinc-950 dark:bg-zinc-100 border-zinc-950 dark:border-zinc-100 text-white dark:text-zinc-950'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-white'
                      }`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>

              {/* Car Grid */}
              {!listingsLoaded && dbListings.length === 0 && filteredCars.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredCars.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-3">
                  <h3 className="font-display text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                    {activeTab === 'saved'
                      ? "Saqlangan avtomobillar yo'q"
                      : "So'rovingiz bo'yicha avtomobil topilmadi"}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                    {activeTab === 'saved'
                      ? "Yoqtirgan avtomobillaringizdagi saqlash tugmasini bosing va ular shu yerda jamlanadi."
                      : "Qidiruv shartlarini o'zgartiring yoki filtrlarni tozalab qayta ko'ring."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'saved') {
                        setActiveTab('all');
                      } else {
                        resetFilters();
                      }
                    }}
                    className="mt-2 min-h-[40px] px-5 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    {activeTab === 'saved' ? "Katalogga qaytish" : 'Filtrlarni tozalash'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCars.map((car) => (
                    <CarCard
                      key={car.id}
                      car={car}
                      isSaved={favoriteIds.has(car.id)}
                      onToggleSave={handleToggleSave}
                      onSelect={(c) => setSelectedCarId(c.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer
        onSelectTab={handleSelectTab}
        onOpenCreate={() => {
          setEditingCar(null);
          setCreateModalOpen(true);
        }}
        totalCount={combinedListings.length}
        isAdmin={isAdmin}
      />

      {selectedCar && (
        <CarDetailModal
          car={selectedCar}
          isSaved={favoriteIds.has(selectedCar.id)}
          onToggleSave={handleToggleSave}
          onClose={() => setSelectedCarId(null)}
          onEdit={(car) => {
            setSelectedCarId(null);
            setEditingCar(car);
            setCreateModalOpen(true);
          }}
        />
      )}

      {createModalOpen && (
        <CreateListingModal
          editingCar={editingCar}
          onClose={() => {
            setCreateModalOpen(false);
            setEditingCar(null);
          }}
          onSaved={(newId) => {
            if (newId) {
              setSelectedCarId(newId);
            }
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MarketplaceContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
