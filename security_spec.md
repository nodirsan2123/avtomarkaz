# Security Specification — AvtoMarkaz

## 1. Data Invariants
1. **Listing Ownership**: Every `/listings/{listingId}` document must bind `sellerId == request.auth.uid` on creation, and `sellerId` + `createdAt` are immutable thereafter.
2. **Terminal Status Lock**: Once a listing reaches `status == 'sold'`, no further updates are allowed (only deletion by owner if desired, or terminal lock on update).
3. **PII Isolation**: Private user fields (`email`, `phone`) live exclusively in `/users/{userId}` (owner-only) and `/listings/{listingId}/contact/seller` (requires verified sign-in to read). Public `/listings/{listingId}` documents never expose phone numbers or emails.
4. **Master Gate on Subcollections**: `/listings/{listingId}/contact/{contactId}` and `/listings/{listingId}/inquiries/{inquiryId}` validate parent listing ownership and existence via `get()`/`exists()`.
5. **Temporal Integrity**: All `createdAt` (on create) and `updatedAt` (on create/update) fields must equal `request.time`.
6. **Self-Inquiry Block**: A seller cannot submit a buyer inquiry on their own listing (`buyerId != sellerId`).

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Shadow Field Injection on Listing Create**: Payload includes valid `CarListing` fields plus `isFeatured: true` -> rejected by `hasOnly(...)`.
2. **Seller Spoofing on Listing Create**: Authenticated user `uidA` tries to create a listing with `sellerId: "uidB"` -> rejected by `data.sellerId == request.auth.uid`.
3. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to create a listing -> rejected by `isVerified()`.
4. **Oversized Image / Description Resource Poisoning**: Listing with `description` > 1200 chars or `imageUrl` > 240000 chars -> rejected by `.size()` bounds.
5. **Path ID Poisoning**: Creating `/listings/invalid id with spaces!` -> rejected by `isValidId(listingId)`.
6. **Terminal State Bypass**: Owner attempts to update a listing whose existing `status == 'sold'` back to `'active'` or change `priceUsd` -> rejected by terminal state lock.
7. **Immortal Field Mutation**: Owner attempts to modify `sellerId` or `createdAt` during listing update -> rejected by `affectedKeys().hasOnly(...)` and immutability check.
8. **Type Poisoning on Update**: Owner sends `priceUsd: "25000"` (string instead of int) -> rejected by `isValidCarListing(incoming())`.
9. **Anonymous PII Scrape on Contact**: Unauthenticated user calls `get` on `/listings/{id}/contact/seller` -> rejected by `isSignedIn()`.
10. **Non-Owner User Profile Read**: Authenticated user `uidA` tries to read `/users/uidB` -> rejected by `isOwner(userId)`.
11. **Inquiry Hijack**: Buyer `uidA` tries to update inquiry `status` to `'accepted'` -> rejected because only listing seller can update inquiry status.
12. **Timestamp Forgery**: Client sends `createdAt: Timestamp(2020-01-01)` instead of `serverTimestamp()` -> rejected by `data.createdAt == request.time`.
