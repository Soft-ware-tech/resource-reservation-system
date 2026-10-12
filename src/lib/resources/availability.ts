import "server-only";

import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type AvailabilityBooking = Prisma.BookingGetPayload<{
  include: { user: { select: { name: true } } };
}>;

type ResourceAvailability = {
  isInUse: boolean;
  until: Date | null;
  nextBooking: AvailabilityBooking | null;
};

export async function getResourceAvailability(resourceId: string, now = new Date()) {
  const availability = await getResourcesAvailability([resourceId], now);
  return availability.get(resourceId) ?? { isInUse: false, until: null, nextBooking: null };
}

export async function getResourcesAvailability(resourceIds: string[], now = new Date()) {
  const result = new Map<string, ResourceAvailability>();
  if (resourceIds.length === 0) return result;

  const bookings = await prisma.booking.findMany({
    where: {
      resourceId: { in: resourceIds },
      status: { in: [BookingStatus.BOOKED, BookingStatus.IN_USE] },
      endAt: { gt: now },
    },
    include: { user: { select: { name: true } } },
    orderBy: [{ resourceId: "asc" }, { startAt: "asc" }, { endAt: "desc" }],
  });
  const bookingsByResource = new Map<string, AvailabilityBooking[]>();
  for (const booking of bookings) {
    const resourceBookings = bookingsByResource.get(booking.resourceId) ?? [];
    resourceBookings.push(booking);
    bookingsByResource.set(booking.resourceId, resourceBookings);
  }

  for (const resourceId of resourceIds) {
    const resourceBookings = bookingsByResource.get(resourceId) ?? [];
    result.set(resourceId, getResourceAvailabilityFromBookings(resourceBookings, now));
  }
  return result;
}

function getResourceAvailabilityFromBookings(bookings: AvailabilityBooking[], now: Date): ResourceAvailability {
  const currentBookings = bookings.filter((booking) => booking.startAt <= now);
  const currentBooking = currentBookings.sort((a, b) => b.endAt.getTime() - a.endAt.getTime())[0];
  const isInUse = Boolean(currentBooking);

  return {
    isInUse,
    until: currentBooking?.endAt ?? bookings[0]?.endAt ?? null,
    nextBooking: isInUse ? currentBooking : null,
  };
}

export function formatColomboDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
