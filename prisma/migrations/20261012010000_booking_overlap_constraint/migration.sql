CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_startAt_before_endAt"
CHECK ("startAt" < "endAt");

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_no_overlapping_active_resource_bookings"
EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
)
WHERE ("status" IN ('BOOKED', 'IN_USE'));
