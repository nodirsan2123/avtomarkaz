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
      className="group bg-white border border-zinc-200 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col"
    >
      {/* Vehicle Visual (neutral studio surface) */}
      <button
        type="button"
        onClick={() => onSelect(car)}
        className="relative h-52 w-full bg-zinc-100 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-700"
      >
        <CarVisual
          imageUrl={car.imageUrl}
          presetKey={car.presetKey}
          alt={`${car.year} ${car.brand} ${car.model}`}
          className={`transition-transform duration-300 group-hover:scale-[1.03] ${
            isSold ? 'opacity-65 grayscale-[30%]' : ''
          }`}
        />
      </button>

      {/* Card Body: Clean unboxed metadata, title, price */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 truncate">
            <span className="font-mono-num">{car.year}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">{formatKm(car.mileageKm)}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{car.city}</span>
            {isSold && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-amber-700">Sotilgan</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelect(car)}
            className="mt-1.5 text-left w-full cursor-pointer focus-visible:outline-none"
          >
            <h3 className="text-base font-semibold text-zinc-950 group-hover:text-blue-700 transition-colors truncate">
              {car.brand} {car.model}
            </h3>
          </button>

          <p className="mt-1 text-xs text-zinc-500 truncate">
            {car.fuelType} / {car.transmission} / {car.color}
          </p>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
          <div className="font-mono-num text-lg font-semibold text-zinc-950">
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
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:border-zinc-300'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
}
