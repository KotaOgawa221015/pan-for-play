# Inventory ERD in Mermaid

This document provides the same inventory model as a Mermaid `erDiagram`.

Nullable columns are marked with a `"NULL"` comment. Required columns omit nullability.

```mermaid
erDiagram
    direction LR

    PRODUCT ||--o{ INVENTORY_CHECK : has
    USER ||--o{ INVENTORY_CHECK : creates
    USER ||--o{ UPLOAD_BATCH : uploads
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
        string email UK
        string passwordHash
        string displayName
        string role
        datetime createdAt
        datetime updatedAt
    }

    INVENTORY_CHECK {
        string id PK
        string productId FK
        string checkedByUserId FK
        string uploadBatchId FK "NULL"
        string status
        string sourceType
        datetime checkedAt
        string note "NULL"
        datetime createdAt
    }

    UPLOAD_BATCH {
        string id PK
        string uploadedByUserId FK
        string originalFileName
        string storagePath
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
        string matchedProductId FK "NULL"
        string matchStatus
        string appliedStatus "NULL"
        datetime createdAt
    }
```

Notes:

- Current inventory is derived from the latest `INVENTORY_CHECK` for each `PRODUCT`.
- `FEW_LEFT` means 1 to 5 items remaining.
- `UPLOAD_BATCH_LINE` represents extracted product candidates from one upload, not a persistent property of `PRODUCT`.
