import { Bookmark } from 'lucide-react';
import { CarListing, formatKm, formatUsd } from '../types/car';
import { CarVisual } from './CarVisual';

interface CarCardProps {
  car: CarListing;
  isSaved: boolean;
  onToggleSave: (car: CarListing) => void;
  onSelect: (car: CarListing) => void;
}

export function CarCard({ car, isSaved, onToggleSave, onSelect }: CarCardProps) {
  const isSold = car.status === 'sold';

  return (
    <article
      className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.015] hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-[0_14px_30px_-12px_rgba(9,9,11,0.16)] dark:hover:shadow-[0_14px_30px_-12px_rgba(0,0,0,0.6)] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0 flex flex-col"
    >
      {/* Vehicle Visual (neutral studio surface) */}
      <button
        type="button"
        onClick={() => onSelect(car)}
        className="relative h-52 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-700"
      >
        <CarVisual
          imageUrl={car.imageUrl}
          presetKey={car.presetKey}
          alt={`${car.year} ${car.brand} ${car.model}`}
          className={`transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
            isSold ? 'opacity-65 grayscale-[30%]' : ''
          }`}
        />
      </button>

      {/* Card Body: Clean unboxed metadata, title, price */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">
            <span className="font-mono-num">{car.year}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">{formatKm(car.mileageKm)}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{car.city}</span>
            {isSold && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-amber-700 dark:text-amber-400">Sotilgan</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelect(car)}
            className="mt-1.5 text-left w-full cursor-pointer focus-visible:outline-none"
          >
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
              {car.brand} {car.model}
            </h3>
          </button>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {car.fuelType} / {car.transmission} / {car.color}
          </p>
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="font-mono-num text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            {formatUsd(car.priceUsd)}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(car);
            }}
            aria-label={isSaved ? "Saqlanganlardan olib tashlash" : "Saqlash"}
            title={isSaved ? "Saqlanganlardan olib tashlash" : "Saqlash"}
            className={`w-10 h-10 inline-flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              isSaved
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
}
