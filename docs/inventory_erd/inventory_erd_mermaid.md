# Inventory ERD in Mermaid

This document provides the current inventory model as a Mermaid `erDiagram`.

Nullable columns are marked with a `"NULL"` comment. Required columns omit nullability.

`USER` follows Auth.js-compatible fields. `ACCOUNT`, `SESSION`, and `VERIFICATION_TOKEN` represent Auth.js adapter tables for OAuth, database sessions, and email tokens.

```mermaid
erDiagram
    direction LR

    USER ||--o{ UPLOAD_BATCH : uploads
    USER ||--o{ INVENTORY_PUBLICATION : publishes
    USER ||--o{ INVENTORY_STATUS_CHANGE : changes
    USER ||--o{ ACCOUNT : links
    USER ||--o{ SESSION : owns

    PRODUCT ||--o{ UPLOAD_BATCH_LINE : matched_by
    PRODUCT ||--o{ INVENTORY_STATUS_CHANGE : changes

    UPLOAD_BATCH ||--|{ UPLOAD_BATCH_LINE : contains
    UPLOAD_BATCH ||--o{ INVENTORY_PUBLICATION : published_as
    INVENTORY_PUBLICATION ||--|{ INVENTORY_STATUS_CHANGE : records

    PRODUCT {
        string id PK
        string name UK
        string category
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
        string identifier PK
        string token PK
        datetime expires
    }

    UPLOAD_BATCH {
        string id PK
        string uploadedByUserId FK
        string originalFileName
        string storagePath "NULL"
        string processingStatus
        datetime processedAt "NULL"
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
        datetime createdAt
    }

    INVENTORY_PUBLICATION {
        string id PK
        string uploadBatchId FK
        string publishedByUserId FK
        datetime publishedAt
        datetime createdAt
    }

    INVENTORY_STATUS_CHANGE {
        string id PK
        string publicationId FK "NULL"
        string productId FK
        string changedByUserId FK
        string previousStatus "NULL"
        string nextStatus
        datetime changedAt
        datetime createdAt
    }
```

Notes:

- Current inventory uses the latest `INVENTORY_PUBLICATION` to select the applied delivery note and its reviewed lines.
- `UPLOAD_BATCH` represents a reviewed delivery note, not the currently active inventory by itself.
- `INVENTORY_PUBLICATION` is append-only. Re-publishing an old batch creates a new publication row.
- `INVENTORY_STATUS_CHANGE` records only user-visible status transitions. Quantity-only movement is not a change log event.
- Product status is derived from `count`; `FEW_LEFT` means 1 to 5 items remaining.
- `VERIFICATION_TOKEN` is an independent token table and does not reference `USER`.
