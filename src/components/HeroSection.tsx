import { Search } from 'lucide-react';
import { CarListing, CITY_OPTIONS, formatKm, formatUsd } from '../types/car';
import { CarVisual } from './CarVisual';

interface HeroSectionProps {
  searchQuery: string;
  selectedCity: string;
  onSearchQueryChange: (val: string) => void;
  onCityChange: (val: string) => void;
  onSearchSubmit: () => void;
  featuredCar: CarListing;
  onSelectFeatured: (car: CarListing) => void;
  totalListings: number;
  activeListings: number;
}

export function HeroSection({
  searchQuery,
  selectedCity,
  onSearchQueryChange,
  onCityChange,
  onSearchSubmit,
  featuredCar,
  onSelectFeatured,
  totalListings,
  activeListings,
}: HeroSectionProps) {
  return (
    <section className="border-b border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left column: Editorial headline & quick search */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-8">
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-3">
                O&apos;zbekiston bo&apos;ylab to&apos;g&apos;ridan-to&apos;g&apos;ri savdo
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 leading-[1.08] [text-wrap:balance] max-w-xl">
                Avtomobilingizni tez va ishonchli soting
              </h1>
              <p className="mt-4 text-base text-zinc-600 leading-relaxed max-w-xl">
                Tekshirilgan e&apos;lonlar, shaffof narxlar va xaridorlar bilan bevosita
                aloqa. Bir necha daqiqada e&apos;lon joylashtiring yoki o&apos;zingizga mos
                avtomobilni toping.
              </p>

              {/* Inline Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSearchSubmit();
                }}
                className="mt-7 flex flex-col sm:flex-row gap-2.5 p-2 bg-zinc-50 border border-zinc-200 rounded-xl"
              >
                <div className="flex-1 flex items-center gap-2.5 px-3 bg-white border border-zinc-200 rounded-lg min-h-[44px]">
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    placeholder="Marka yoki model (masalan, Malibu, BYD)"
                    aria-label="Marka yoki model qidirish"
                    className="w-full text-sm text-zinc-950 placeholder:text-zinc-400 bg-transparent focus:outline-none"
                  />
                </div>

                <select
                  value={selectedCity}
                  onChange={(e) => onCityChange(e.target.value)}
                  aria-label="Shaharni tanlang"
                  className="sm:w-44 px-3 min-h-[44px] text-sm text-zinc-900 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <option value="">Barcha shaharlar</option>
                  {CITY_OPTIONS.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="px-6 min-h-[44px] bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Qidirish
                </button>
              </form>
            </div>

            {/* Clean unboxed metrics strip */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-200">
              <div>
                <div className="font-mono-num text-2xl font-semibold text-zinc-950">
                  {activeListings}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Faol e&apos;lonlar</div>
              </div>
              <div className="border-l border-zinc-200 pl-6">
                <div className="font-mono-num text-2xl font-semibold text-zinc-950">
                  {totalListings}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Jami katalog</div>
              </div>
              <div className="border-l border-zinc-200 pl-6">
                <div className="font-mono-num text-2xl font-semibold text-zinc-950">
                  10+
                </div>
                <div className="text-xs text-zinc-500 mt-1">Viloyat va shaharlar</div>
              </div>
            </div>
          </div>

          {/* Right column: Featured car showcase */}
          <div className="lg:col-span-5 flex items-center">
            <button
              type="button"
              onClick={() => onSelectFeatured(featuredCar)}
              className="group relative w-full h-64 sm:h-72 lg:h-[340px] rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-900 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <CarVisual
                imageUrl={featuredCar.imageUrl}
                presetKey={featuredCar.presetKey}
                alt={`${featuredCar.year} ${featuredCar.brand} ${featuredCar.model}`}
                darkBackdrop
                className="transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-zinc-300 mb-1 truncate">
                    Tanlangan taklif · {featuredCar.city} · {formatKm(featuredCar.mileageKm)}
                  </div>
                  <div className="font-display text-xl font-semibold text-white truncate">
                    {featuredCar.year} {featuredCar.brand} {featuredCar.model}
                  </div>
                </div>
                <div className="font-mono-num text-lg font-semibold text-white shrink-0">
                  {formatUsd(featuredCar.priceUsd)}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
