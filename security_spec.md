# Security Specification — Hooniyan Build (Spreadsheet View-Only + Editor Link)

## Architecture & Access Model
- The app operates on a login-free link-sharing model (View-Only `/` for Konsumen, Editor `/?mode=pengawas` for Pengawas) backed by permanent Firestore persistence on project `proj-ria-01`.
- Because no user authentication flow exists in the app, security rules strictly enforce:
  1. **Default-deny catch-all** (`match /{document=**} { allow read, write: if false; }`).
  2. **Path variable hardening** (`isValidId()` regex + max length 128) on all single-document targets.
  3. **Strict schema & key allowlisting** (`keys().hasAll(...) && keys().hasOnly(...)` on create; `affectedKeys().hasOnly(...)` + full schema validation on update).
  4. **Mandatory string length & numeric bounds** on every field (including bounded base64 photo payloads <= 450,000 chars per image field to stay under Firestore's 1MB document limit).
  5. **Relational consistency** (`incoming().projectId == projectId` and `existsAfter(...)` verification on parent `/projects/{projectId}`).
  6. **Immutability & server timestamps** (`id`, `projectId`, `createdAt` immutable; `createdAt == request.time`, `updatedAt == request.time`).
  7. **Scoped list queries** (`allow list: if resource.data.projectId == projectId;`).

## Data Invariants
1. A milestone, weeklyRecord, photo, message, paymentTerm, or notification cannot exist without a valid parent project at `/projects/{projectId}` and matching `projectId`.
2. Milestone `progressPercent` is strictly bounded `[0, 100]`, and `weight` is strictly bounded `[0, 100]`.
3. Weekly progress cumulative and weekly values are strictly bounded `[0, 100]` and `week` is bounded `[1, 100]`.
4. Project `currentProgress` and `plannedProgress` are strictly bounded `[0, 100]`.
5. No arbitrary extra ("ghost") keys are permitted on any document.
6. Client-supplied timestamps cannot forge `createdAt` or `updatedAt` (validated against `request.time`).
7. IDs on all documents and path variables must match `^[a-zA-Z0-9_\-]+$` with length <= 128.

## Dirty Dozen Payloads (Expected PERMISSION_DENIED)
1. Shadow key injection (`isAdmin: true`) on `/projects/proj-ria-01` create or update.
2. Oversized `projectId` (> 128 chars or invalid chars like `proj$bad`) on any path.
3. Creating a milestone with `progressPercent: 150` (out of `[0, 100]` bounds).
4. Updating a milestone to change `weight` or `projectId` (outside allowed `affectedKeys`).
5. Creating a `weeklyRecord` without a valid parent project (`projectId: "nonexistent"`).
6. Creating a `weeklyRecord` with `actualCumulative: -5` or forged `createdAt` timestamp.
7. Uploading a `SitePhoto` with `imageUrl` exceeding 450,000 characters (resource exhaustion guard).
8. Creating a `ChatMessage` with invalid `senderRole: "hacker"` or empty/oversized `text` (> 2000 chars).
9. Updating a `ChatMessage` to alter `text` or `senderRole` after creation (only `read` flag update allowed).
10. Writing to an unlisted collection `/secrets/doc1` (blocked by default-deny catch-all).
11. Updating `Project.id` or `Project.createdAt` (immutable fields).
12. Deleting `/projects/proj-ria-01` or any milestone/weeklyRecord/paymentTerm/message.
