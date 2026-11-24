# TaskFlow Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership**: Every document under `/users/{userId}/...` is exclusively readable and writable by the authenticated, email-verified user whose `request.auth.uid == userId`.
2. **PII Isolation**: User email and display details live solely in `/users/{userId}/private/profile` and are never exposed via blanket `isSignedIn()` reads.
3. **Referential Integrity**: A task in `/users/{userId}/tasks/{taskId}` cannot be created unless its `projectId` exists (or is created in the same atomic batch via `existsAfter`) under `/users/{userId}/projects/{projectId}`.
4. **Immutable Identity & Temporal Integrity**: `ownerId`, `id`, and `createdAt` are immutable after creation. `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
5. **Bounded Payloads & Strict Schemas**: Every string has strict length bounds, IDs match `^[a-zA-Z0-9_\-]+$`, `subtasks` is bounded to at most 15 items with typed first-element checking, and shadow/ghost fields are rejected via `keys().hasAll` + `keys().hasOnly` and `affectedKeys().hasOnly`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Cross-Tenant Read**: User B attempts `get(/users/userA/tasks/task1)` -> `PERMISSION_DENIED`.
2. **Blanket List Scraping**: Unauthenticated or non-owner calls `list(/users/userA/tasks)` -> `PERMISSION_DENIED`.
3. **Unverified Email Write**: Authenticated user with `email_verified: false` creates a project -> `PERMISSION_DENIED`.
4. **Identity Spoofing**: User A creates task with `ownerId: "userB"` -> `PERMISSION_DENIED`.
5. **Orphaned Task Write**: User A creates task referencing `projectId: "nonexistent_proj"` -> `PERMISSION_DENIED`.
6. **Shadow Field Injection**: User A creates task with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
7. **ID Poisoning**: User A writes to `/users/userA/tasks/../../../etc/passwd` or 500-char ID -> `PERMISSION_DENIED`.
8. **Client Timestamp Forgery**: User A creates task with client-forged `createdAt` != `request.time` -> `PERMISSION_DENIED`.
9. **Immutable Field Mutation**: User A updates `ownerId` or `createdAt` on an existing task -> `PERMISSION_DENIED`.
10. **Array Exhaustion**: User A updates task with 50 subtasks (> 15 max) -> `PERMISSION_DENIED`.
11. **Value Type Poisoning**: User A updates `priority` to `"critical"` (invalid enum) or a 10KB string -> `PERMISSION_DENIED`.
12. **PII Leakage**: User B reads `/users/userA/private/profile` -> `PERMISSION_DENIED`.
