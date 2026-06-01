# Security Specification for "¿Cómo Voy?" Firestore Rules

## 1. Data Invariants

1. **Authentication Requirement**: No unauthenticated client can read or write any class records.
2. **Account Ownership**: A teacher can only create, update, or delete records that explicitly belong to them (`userId == request.auth.uid`).
3. **Collaboration Boundary**: Authenticated teachers with verified emails can read all records from the school to check co-educator progress, but are strictly unauthorized to modify another teacher's files.
4. **Strict Schema**: Every created record must fit the precise model structure (correct enum values for grade and subject, valid dates, size limits on inputs, and defined field types).
5. **No Spoofing**: Teachers cannot alter the `userId` of existing documents to impersonate others or transfer ownership.
6. **Data Size Bounds**: In order to prevent Denial of Wallet (DoW) attacks, text values for tema, actividades, logs, and difficulties are constrained to sensible limits.

## 2. The "Dirty Dozen" Malicious Payloads (Permission Denied Verification)

The following payload attempts must be explicitly rejected by the security rules:

1. **Unauthenticated Read Check**: Trying to fetch records without logging in.
2. **Unauthenticated Write Check**: Trying to save a record without logging in.
3. **Identity Impersonation (Create)**: Teacher A trying to write a record where `userId` is set to Teacher B's UID.
4. **Identity Hijacking (Update)**: Teacher B trying to modify a record owned by Teacher A.
5. **Ownership Tampering**: Teacher A trying to update their own record and change its `userId` to Teacher B.
6. **Ghost Key Injection**: Attempting to insert unapproved properties (`isVerified: true`, `isAdmin: true` or custom roles) during create.
7. **Invalid Grade Enum**: Creating a record for an unsupported grade (e.g., `grado: "9"`).
8. **Invalid Subject Enum**: Creating a record for an unsupported subject (e.g., `asig: "Matemáticas"`).
9. **Invalid Status Enum**: Forcing an illegal status like `estado: "Excelente_Súper"`.
10. **Huge Data Attack**: Attempting to upload a 5MB string for the `tema` or `observaciones` field.
11. **Spoofed Created Timestamp**: Trying to specify a backdated or client-side value for `createdAt` instead of `request.time`.
12. **Unauthorized Metadata Update**: Trying to alter immutable fields like `createdAt` during updates.
