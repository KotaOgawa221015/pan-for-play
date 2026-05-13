# Inventory ERD in Mermaid

This document provides the same inventory model as a Mermaid `erDiagram`.

Nullable columns are marked with a `"NULL"` comment. Required columns omit nullability.

`USER` follows Auth.js-compatible fields. `ACCOUNT`, `SESSION`, and `VERIFICATION_TOKEN` represent Auth.js adapter tables for OAuth, database sessions, and email tokens.

```mermaid
erDiagram
    direction LR

    PRODUCT ||--o{ INVENTORY_CHECK : has
    USER ||--o{ INVENTORY_CHECK : creates
    USER ||--o{ UPLOAD_BATCH : uploads
    USER ||--o{ ACCOUNT : links
    USER ||--o{ SESSION : owns
    UPLOAD_BATCH ||--|{ UPLOAD_BATCH_LINE : contains
    UPLOAD_BATCH ||--o{ INVENTORY_CHECK : sources
    PRODUCT ||--o{ UPLOAD_BATCH_LINE : matches

    PRODUCT {
        string id PK
        string name UK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    USER {
        string id PK
        string name
        string email UK
        datetime emailVerified "NULL"
        string image "NULL"
        string passwordHash
        string role
        datetime createdAt
        datetime updatedAt
    }

    ACCOUNT {
        string id PK
        string userId FK
        string type
        string provider
        string providerAccountId
        string refreshToken "NULL"
        string accessToken "NULL"
        int expiresAt "NULL"
        string tokenType "NULL"
        string scope "NULL"
        string idToken "NULL"
        string sessionState "NULL"
    }

    SESSION {
        string id PK
        string sessionToken UK
        string userId FK
        datetime expires
    }

    VERIFICATION_TOKEN {
        string identifier
        string token
        datetime expires
    }

    INVENTORY_CHECK {
        string id PK
        string productId FK
        string checkedByUserId FK
        string uploadBatchId FK "NULL"
        string status
        int count
        string sourceType
        boolean isActive
        datetime checkedAt
        string note "NULL"
        datetime createdAt
    }

    UPLOAD_BATCH {
        string id PK
        string uploadedByUserId FK
        string originalFileName
        string storagePath "NULL"
        string processingStatus
        datetime processedAt "NULL"
        datetime appliedAt "NULL"
        datetime revertedAt "NULL"
        datetime createdAt
        datetime updatedAt
    }

    UPLOAD_BATCH_LINE {
        string id PK
        string uploadBatchId FK
        int lineNumber
        string rawText
        int count
        string matchedProductId FK "NULL"
        string matchStatus
        string appliedStatus
        datetime createdAt
    }
```

Notes:

- Current inventory is derived from the latest active `INVENTORY_CHECK` for each `PRODUCT`.
- `FEW_LEFT` means 1 to 5 items remaining.
- `UPLOAD_BATCH_LINE` represents extracted product candidates from one upload, not a persistent property of `PRODUCT`.
- Credentials + JWT uses `USER` for authentication state. OAuth uses `ACCOUNT`, database sessions use `SESSION`, and email-token flows use `VERIFICATION_TOKEN`.
- `VERIFICATION_TOKEN` is an independent token table and does not reference `USER`.
