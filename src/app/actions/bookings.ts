"use server";

import { BookingStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { findNextAvailableStart, overlaps } from "@/lib/bookings/logic";
import { colomboTimeToUtc } from "@/lib/bookings/time";
import { prisma } from "@/lib/db";
import { formatColomboDateTime } from "@/lib/resources/availability";
import { bookingSchema } from "@/lib/validation/resources";

const MAX_BOOKING_DURATION_MS = 12 * 60 * 60 * 1000;
const ACTIVE_BOOKING_STATUSES = [BookingStatus.BOOKED, BookingStatus.IN_USE];

export type BookingActionState = {
  error?: string;
  success?: string;
};

function stringField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isExclusionViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2010" && error.meta?.code === "23P01") return true;
    if (error.code === "P2004") {
      const message = JSON.stringify(error.meta ?? "");
      if (message.includes("23P01") || message.includes("Booking_no_overlapping_active_resource_bookings")) {
        return true;
      }
    }
  }
  if (error instanceof Error) {
    return error.message.includes("23P01") ||
      error.message.includes("Booking_no_overlapping_active_resource_bookings");
  }
  return false;
}

async function getConflictMessage(resourceId: string, startAt: Date, endAt: Date) {
  const bookings = await prisma.booking.findMany({
    where: {
      resourceId,
      status: { in: ACTIVE_BOOKING_STATUSES },
      endAt: { gt: startAt },
    },
    select: { startAt: true, endAt: true },
    orderBy: { startAt: "asc" },
  });
  const conflict = bookings.find((booking) => overlaps({ startAt, endAt }, booking));
  if (!conflict) {
    return "This resource was just booked by someone else. Refresh the page and choose another time.";
  }

  const duration = endAt.getTime() - startAt.getTime();
  const suggestedStart = findNextAvailableStart(startAt, duration, bookings);
  return `Already booked, please wait until ${formatColomboDateTime(conflict.endAt)}. Next available for this duration: ${formatColomboDateTime(suggestedStart)}.`;
}

export async function createBooking(
  _previousState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const user = await requireRole("USER");
  const parsed = bookingSchema.safeParse({
    resourceId: stringField(formData, "resourceId"),
    startAt: stringField(formData, "startAt"),
    endAt: stringField(formData, "endAt"),
    purpose: stringField(formData, "purpose"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the booking details and try again." };
  }

  const startAt = colomboTimeToUtc(parsed.data.startAt);
  const endAt = colomboTimeToUtc(parsed.data.endAt);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime())) {
    return { error: "Enter valid start and end times." };
  }
  if (startAt.getTime() < Date.now()) {
    return { error: "The booking start time cannot be in the past." };
  }
  if (endAt <= startAt) {
    return { error: "The end time must be after the start time." };
  }
  if (endAt.getTime() - startAt.getTime() > MAX_BOOKING_DURATION_MS) {
    return { error: "Bookings can be up to 12 hours long." };
  }

  const resource = await prisma.resource.findFirst({
    where: { id: parsed.data.resourceId, active: true },
    select: { id: true },
  });
  if (!resource) return { error: "This resource is no longer available to book." };

  const bookings = await prisma.booking.findMany({
    where: {
      resourceId: resource.id,
      status: { in: ACTIVE_BOOKING_STATUSES },
      endAt: { gt: startAt },
    },
    select: { startAt: true, endAt: true },
    orderBy: { startAt: "asc" },
  });
  const conflict = bookings.find((booking) => overlaps({ startAt, endAt }, booking));
  if (conflict) return { error: await getConflictMessage(resource.id, startAt, endAt) };

  try {
    await prisma.booking.create({
      data: {
        userId: user.id,
        resourceId: resource.id,
        startAt,
        endAt,
        purpose: parsed.data.purpose || null,
        status: BookingStatus.BOOKED,
      },
    });
  } catch (error) {
    if (isExclusionViolation(error)) {
      return { error: await getConflictMessage(resource.id, startAt, endAt) };
    }
    throw error;
  }

  revalidatePath("/user");
  revalidatePath("/user/bookings");
  revalidatePath("/user/categories/[slug]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/available");
  revalidatePath("/admin/in-use");
  return { success: "Resource reserved. You can find it in My Bookings." };
}

export async function cancelBooking(formData: FormData) {
  const user = await requireRole("USER");
  const bookingId = stringField(formData, "bookingId");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
    redirect("/user/bookings?error=invalid");
  }

  const result = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      userId: user.id,
      status: BookingStatus.BOOKED,
      startAt: { gt: new Date() },
    },
    data: { status: BookingStatus.CANCELLED },
  });
  if (result.count === 0) redirect("/user/bookings?error=cancel");

  revalidatePath("/user");
  revalidatePath("/user/bookings");
  revalidatePath("/user/categories/[slug]", "page");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/available");
  revalidatePath("/admin/in-use");
  redirect("/user/bookings?success=cancelled");
}

export async function markBookingInUse(formData: FormData) {
  const user = await requireRole("USER");
  const bookingId = stringField(formData, "bookingId");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
    redirect("/user/bookings?error=invalid");
  }

  const now = new Date();
  const result = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      userId: user.id,
      status: BookingStatus.BOOKED,
      startAt: { lte: now },
      endAt: { gt: now },
    },
    data: { status: BookingStatus.IN_USE },
  });
  if (result.count === 0) redirect("/user/bookings?error=start");

  revalidatePath("/user/bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/in-use");
  redirect("/user/bookings?success=started");
}

export async function returnBooking(formData: FormData) {
  const user = await requireRole("USER");
  const bookingId = stringField(formData, "bookingId");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
    redirect("/user/bookings?error=invalid");
  }

  const now = new Date();
  const result = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      userId: user.id,
      status: { in: [BookingStatus.BOOKED, BookingStatus.IN_USE] },
      startAt: { lt: now },
      endAt: { gt: now },
    },
    data: { status: BookingStatus.COMPLETED, endAt: now },
  });
  if (result.count === 0) redirect("/user/bookings?error=return");

  revalidatePath("/user");
  revalidatePath("/user/bookings");
  revalidatePath("/user/categories/[slug]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/available");
  revalidatePath("/admin/in-use");
  redirect("/user/bookings?success=returned");
}
