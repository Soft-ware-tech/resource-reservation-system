# Resource reservation ER diagram

Paste this Mermaid code into [mermaid.live](https://mermaid.live) to render or share the diagram.

```mermaid
erDiagram
    User ||--o{ Booking : makes
    Category ||--o{ Resource : groups
    Resource ||--o{ Booking : receives

    User {
        UUID id PK
        string name
        string email UK
        string passwordHash
        Role role
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Category {
        UUID id PK
        string name UK
        string slug UK
        string description
        datetime createdAt
        datetime updatedAt
    }

    Resource {
        UUID id PK
        string name
        UUID categoryId FK
        string description
        string details
        string imageUrl
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Booking {
        UUID id PK
        UUID userId FK
        UUID resourceId FK
        datetime startAt
        datetime endAt
        string purpose
        BookingStatus status
        datetime createdAt
        datetime updatedAt
    }
```

Each category can contain many resources, while every resource belongs to one category. A user can make many bookings, and each booking belongs to one user and one resource.
