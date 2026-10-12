import "server-only";

import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getResourceAvailability(resourceId: string, now = new Date()) {
  const bookings = await prisma.booking.findMany({
    where: {
      resourceId,
      status: { in: [BookingStatus.BOOKED, BookingStatus.IN_USE] },
      endAt: { gt: now },
    },
    include: { user: { select: { name: true } } },
    orderBy: [{ startAt: "asc" }, { endAt: "desc" }],
  });
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
