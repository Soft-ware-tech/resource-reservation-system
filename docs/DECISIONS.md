# Technical decisions in simple language

These notes explain the choices behind the resource reservation system in interview-friendly terms.

## Why this data model?

The application has four main things: users, categories, resources, and bookings.

- A category groups resources, such as rooms or equipment.
- A resource belongs to one category. Categories can have many resources.
- A booking connects one user to one resource for a time range.
- A booking status records whether the reservation is booked, in use, completed, or cancelled.

This keeps the data normalized: the resource name and user email are stored once, rather than copied into each booking. Foreign keys ensure a booking cannot point at a missing user or resource.

## Why PostgreSQL prevents overlapping bookings

Checking availability in application code is useful for friendly messages, but it is not enough for correctness. Two requests might check at the same time, both see an empty slot, and both try to reserve it.

PostgreSQL has an exclusion constraint on the resource ID and the booking time range. The database rejects an overlapping active reservation even if two requests race. The range is `[start, end)`: it includes the start and excludes the end. That means a reservation can start exactly when the previous reservation ends.

The server still checks availability first so it can tell a person when the resource is already booked and suggest another start time. The database constraint is the final safety net.

## Why store UTC but show Colombo time?

The database stores time-zone-aware timestamps as UTC instants. UTC makes comparisons reliable no matter where the server runs. The app converts from Asia/Colombo when reading date/time inputs and formats dates in Colombo for people using the application.

The admin date filter also constructs the selected Colombo calendar day’s UTC boundaries, so “one day” means the same thing in the UI and database.

## Why an HTTP-only cookie for login?

After a successful email/password check, the server signs a short-lived session token and sends it in an HTTP-only cookie. Browser JavaScript cannot read that cookie, which lowers the chance that a script injection can steal it. The server checks the token and looks up the active user and role on protected requests.

Passwords are stored as bcrypt hashes, not plain text. The role is checked both at the route boundary and again in server actions that change data.

## Why server actions and Prisma?

Server actions keep form submissions close to the pages that use them while ensuring database credentials and mutation logic stay on the server. Prisma provides typed queries and migrations so model changes are reviewable and database access is consistent.

Each server action verifies the user’s role and validates submitted values. Expected conflicts are reported to the user; unexpected database errors are not converted into fake success responses.

## Why half-open reservation ranges?

The database represents an active booking as `[start, end)`. The ending instant is not occupied. This is intuitive for schedules: one meeting can use a room from 10:00 to 11:00, and the next can start at 11:00 without overlap.

## Why a custom calendar instead of a calendar package?

The product needs a focused monthly overview with resource name, time, and holder, not a full event-editing suite. A small custom calendar keeps the dependency set lean and allows a simple mobile agenda presentation.

## Why keep the UI responsive and accessible?

Admins and staff may check availability from phones as well as desktop computers. Layouts stack at small widths, calendars become agendas, and tables become labelled cards. Buttons and forms use labels, visible focus styles, status announcements, and confirmation prompts for destructive or important actions.
