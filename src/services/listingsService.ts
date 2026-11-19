import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  BodyStyle,
  CarCondition,
  CarListing,
  FuelType,
  InquiryStatus,
  ListingContact,
  ListingInquiry,
  PresetKey,
  Transmission,
  VALIDATION_LIMITS,
} from '../types/car';

export interface ListingInput {
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
  phone: string;
  telegram?: string;
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  return Date.now();
}

function clampInt(value: number, min: number, max: number): number {
  const num = Math.round(Number(value));
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function sanitizeListingInput(input: ListingInput) {
  const brand = input.brand.trim().slice(0, VALIDATION_LIMITS.brandMax);
  const model = input.model.trim().slice(0, VALIDATION_LIMITS.modelMax);
  const color = input.color.trim().slice(0, VALIDATION_LIMITS.colorMax);
  const city = input.city.trim().slice(0, VALIDATION_LIMITS.cityMax);
  const description = input.description.trim().slice(0, VALIDATION_LIMITS.descriptionMax);
  const imageUrl = input.imageUrl.trim().slice(0, VALIDATION_LIMITS.imageUrlMax);
  const phone = input.phone.trim();
  const telegram = (input.telegram || '').trim().slice(0, VALIDATION_LIMITS.telegramMax);

  if (!brand) throw new Error('Marka kiritilishi shart');
  if (!model) throw new Error('Model kiritilishi shart');
  if (!color) throw new Error('Rang kiritilishi shart');
  if (!city) throw new Error('Shahar tanlanishi shart');
  if (description.length < VALIDATION_LIMITS.descriptionMin) {
    throw new Error(`Tavsif kamida ${VALIDATION_LIMITS.descriptionMin} ta belgidan iborat bo'lishi kerak`);
  }
  if (!VALIDATION_LIMITS.phonePattern.test(phone)) {
    throw new Error("Telefon raqami +998901234567 formatida bo'lishi kerak");
  }

  return {
    brand,
    model,
    year: clampInt(input.year, VALIDATION_LIMITS.yearMin, VALIDATION_LIMITS.yearMax),
    priceUsd: clampInt(input.priceUsd, VALIDATION_LIMITS.priceMin, VALIDATION_LIMITS.priceMax),
    mileageKm: clampInt(input.mileageKm, VALIDATION_LIMITS.mileageMin, VALIDATION_LIMITS.mileageMax),
    fuelType: input.fuelType,
    transmission: input.transmission,
    bodyStyle: input.bodyStyle,
    color,
    condition: input.condition,
    city,
    description,
    imageUrl,
    presetKey: input.presetKey,
    phone,
    telegram,
  };
}

export function subscribeToListings(
  onData: (listings: CarListing[]) => void,
  onError?: (err: Error) => void
) {
  const listingsQuery = query(
    collection(db, 'listings'),
    where('status', 'in', ['active', 'sold'])
  );

  return onSnapshot(
    listingsQuery,
    (snapshot) => {
      const items: CarListing[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          sellerId: String(d.sellerId ?? ''),
          sellerName: String(d.sellerName ?? 'Sotuvchi'),
          brand: String(d.brand ?? ''),
          model: String(d.model ?? ''),
          year: Number(d.year ?? 2024),
          priceUsd: Number(d.priceUsd ?? 0),
          mileageKm: Number(d.mileageKm ?? 0),
          fuelType: d.fuelType as FuelType,
          transmission: d.transmission as Transmission,
          bodyStyle: d.bodyStyle as BodyStyle,
          color: String(d.color ?? ''),
          condition: d.condition as CarCondition,
          city: String(d.city ?? ''),
          description: String(d.description ?? ''),
          imageUrl: String(d.imageUrl ?? ''),
          presetKey: (d.presetKey || 'white_sedan') as PresetKey,
          status: (d.status || 'active') as 'active' | 'sold',
          createdAtMs: toMillis(d.createdAt),
          updatedAtMs: toMillis(d.updatedAt),
        };
      });

      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.LIST, 'listings');
    }
  );
}

export function subscribeToFavorites(
  userId: string,
  onData: (favoriteIds: Set<string>) => void
) {
  const path = `users/${userId}/favorites`;
  return onSnapshot(
    collection(db, 'users', userId, 'favorites'),
    (snapshot) => {
      onData(new Set(snapshot.docs.map((d) => d.id)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function toggleFavorite(
  userId: string,
  listingId: string,
  isCurrentlySaved: boolean
) {
  const path = `users/${userId}/favorites/${listingId}`;
  try {
    const favRef = doc(db, 'users', userId, 'favorites', listingId);
    if (isCurrentlySaved) {
      await deleteDoc(favRef);
    } else {
      await setDoc(favRef, {
        listingId,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      isCurrentlySaved ? OperationType.DELETE : OperationType.CREATE,
      path
    );
  }
}

export async function createCarListing(
  sellerId: string,
  sellerName: string,
  input: ListingInput
): Promise<string> {
  const clean = sanitizeListingInput(input);
  const safeSellerName = sellerName.trim().slice(0, VALIDATION_LIMITS.sellerNameMax) || 'Sotuvchi';

  const listingRef = doc(collection(db, 'listings'));
  const contactRef = doc(db, 'listings', listingRef.id, 'contact', 'seller');
  const path = `listings/${listingRef.id}`;

  try {
    const batch = writeBatch(db);
    batch.set(listingRef, {
      sellerId,
      sellerName: safeSellerName,
      brand: clean.brand,
      model: clean.model,
      year: clean.year,
      priceUsd: clean.priceUsd,
      mileageKm: clean.mileageKm,
      fuelType: clean.fuelType,
      transmission: clean.transmission,
      bodyStyle: clean.bodyStyle,
      color: clean.color,
      condition: clean.condition,
      city: clean.city,
      description: clean.description,
      imageUrl: clean.imageUrl,
      presetKey: clean.presetKey,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const contactPayload: Record<string, unknown> = {
      sellerId,
      phone: clean.phone,
      updatedAt: serverTimestamp(),
    };
    if (clean.telegram) {
      contactPayload.telegram = clean.telegram;
    }
    batch.set(contactRef, contactPayload);

    await batch.commit();
    return listingRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCarListing(
  listingId: string,
  sellerId: string,
  input: ListingInput
): Promise<void> {
  const clean = sanitizeListingInput(input);
  const listingRef = doc(db, 'listings', listingId);
  const contactRef = doc(db, 'listings', listingId, 'contact', 'seller');
  const path = `listings/${listingId}`;

  try {
    const batch = writeBatch(db);
    batch.update(listingRef, {
      brand: clean.brand,
      model: clean.model,
      year: clean.year,
      priceUsd: clean.priceUsd,
      mileageKm: clean.mileageKm,
      fuelType: clean.fuelType,
      transmission: clean.transmission,
      bodyStyle: clean.bodyStyle,
      color: clean.color,
      condition: clean.condition,
      city: clean.city,
      description: clean.description,
      imageUrl: clean.imageUrl,
      presetKey: clean.presetKey,
      updatedAt: serverTimestamp(),
    });

    const contactSnap = await getDoc(contactRef);
    const contactPayload: Record<string, unknown> = {
      sellerId,
      phone: clean.phone,
      telegram: clean.telegram,
      updatedAt: serverTimestamp(),
    };

    if (contactSnap.exists()) {
      batch.update(contactRef, {
        phone: clean.phone,
        telegram: clean.telegram,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(contactRef, contactPayload);
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markListingAsSold(listingId: string): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await updateDoc(doc(db, 'listings', listingId), {
      status: 'sold',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCarListing(listingId: string): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'listings', listingId, 'contact', 'seller'));
    batch.delete(doc(db, 'listings', listingId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchListingContact(listingId: string): Promise<ListingContact | null> {
  const path = `listings/${listingId}/contact/seller`;
  try {
    const snap = await getDoc(doc(db, 'listings', listingId, 'contact', 'seller'));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      sellerId: String(d.sellerId ?? ''),
      phone: String(d.phone ?? ''),
      telegram: d.telegram ? String(d.telegram) : undefined,
      updatedAtMs: toMillis(d.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function submitListingInquiry(params: {
  listing: CarListing;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  offerUsd: number;
  message: string;
}): Promise<void> {
  const buyerPhone = params.buyerPhone.trim();
  const message = params.message.trim().slice(0, VALIDATION_LIMITS.messageMax);
  const buyerName =
    params.buyerName.trim().slice(0, VALIDATION_LIMITS.sellerNameMax) || 'Xaridor';
  const offerUsd = clampInt(
    params.offerUsd,
    VALIDATION_LIMITS.priceMin,
    VALIDATION_LIMITS.priceMax
  );
  const listingTitle = `${params.listing.year} ${params.listing.brand} ${params.listing.model}`.slice(
    0,
    120
  );

  if (!VALIDATION_LIMITS.phonePattern.test(buyerPhone)) {
    throw new Error("Telefon raqami +998901234567 formatida bo'lishi kerak");
  }
  if (message.length < VALIDATION_LIMITS.messageMin) {
    throw new Error("Xabar kamida 3 ta belgidan iborat bo'lishi kerak");
  }

  const inquiryRef = doc(collection(db, 'listings', params.listing.id, 'inquiries'));
  const path = `listings/${params.listing.id}/inquiries/${inquiryRef.id}`;

  try {
    await setDoc(inquiryRef, {
      listingId: params.listing.id,
      listingTitle,
      sellerId: params.listing.sellerId,
      buyerId: params.buyerId,
      buyerName,
      buyerPhone,
      offerUsd,
      message,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToListingInquiriesForSeller(
  listingId: string,
  sellerId: string,
  onData: (inquiries: ListingInquiry[]) => void
) {
  const path = `listings/${listingId}/inquiries`;
  const q = query(
    collection(db, 'listings', listingId, 'inquiries'),
    where('sellerId', '==', sellerId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ListingInquiry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          listingId: String(data.listingId ?? listingId),
          listingTitle: String(data.listingTitle ?? ''),
          sellerId: String(data.sellerId ?? sellerId),
          buyerId: String(data.buyerId ?? ''),
          buyerName: String(data.buyerName ?? ''),
          buyerPhone: String(data.buyerPhone ?? ''),
          offerUsd: Number(data.offerUsd ?? 0),
          message: String(data.message ?? ''),
          status: (data.status || 'pending') as InquiryStatus,
          createdAtMs: toMillis(data.createdAt),
          updatedAtMs: toMillis(data.updatedAt),
        };
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToBuyerInquiriesForListing(
  listingId: string,
  buyerId: string,
  onData: (inquiries: ListingInquiry[]) => void
) {
  const path = `listings/${listingId}/inquiries`;
  const q = query(
    collection(db, 'listings', listingId, 'inquiries'),
    where('buyerId', '==', buyerId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ListingInquiry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          listingId: String(data.listingId ?? listingId),
          listingTitle: String(data.listingTitle ?? ''),
          sellerId: String(data.sellerId ?? ''),
          buyerId: String(data.buyerId ?? buyerId),
          buyerName: String(data.buyerName ?? ''),
          buyerPhone: String(data.buyerPhone ?? ''),
          offerUsd: Number(data.offerUsd ?? 0),
          message: String(data.message ?? ''),
          status: (data.status || 'pending') as InquiryStatus,
          createdAtMs: toMillis(data.createdAt),
          updatedAtMs: toMillis(data.updatedAt),
        };
      });
      items.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateInquiryStatus(
  listingId: string,
  inquiryId: string,
  status: 'accepted' | 'declined'
): Promise<void> {
  const path = `listings/${listingId}/inquiries/${inquiryId}`;
  try {
    await updateDoc(doc(db, 'listings', listingId, 'inquiries', inquiryId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function compressCarImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasm formati noto'g'ri"));
      img.onload = () => {
        const maxWidth = 900;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas konteksti topilmadi'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.78;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 220000 && quality > 0.35) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > VALIDATION_LIMITS.imageUrlMax) {
          reject(new Error("Rasm hajmi juda katta, kichikroq rasm tanlang"));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
