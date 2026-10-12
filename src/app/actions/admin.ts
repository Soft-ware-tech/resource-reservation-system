"use server";

import { BookingStatus, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const managedUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().max(254),
  password: z.string().min(8).max(128),
});

function revalidateAdminViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/available");
  revalidatePath("/admin/in-use");
  revalidatePath("/user");
  revalidatePath("/user/bookings");
  revalidatePath("/user/categories/[slug]", "page");
}

export async function adminCancelBooking(formData: FormData) {
  await requireRole("ADMIN");
  const bookingId = formString(formData, "bookingId");
  if (!isUuid(bookingId)) redirect("/admin/bookings?error=invalid");

  const result = await prisma.booking.updateMany({
    where: { id: bookingId, status: { in: [BookingStatus.BOOKED, BookingStatus.IN_USE] } },
    data: { status: BookingStatus.CANCELLED },
  });
  if (result.count === 0) redirect("/admin/bookings?error=inactive");

  revalidateAdminViews();
  redirect("/admin/bookings?success=cancelled");
}

export async function adminReturnBooking(formData: FormData) {
  await requireRole("ADMIN");
  const bookingId = formString(formData, "bookingId");
  if (!isUuid(bookingId)) redirect("/admin/in-use?error=invalid");

  const now = new Date();
  const result = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      status: { in: [BookingStatus.BOOKED, BookingStatus.IN_USE] },
      startAt: { lte: now },
      endAt: { gt: now },
    },
    data: { status: BookingStatus.COMPLETED, endAt: now },
  });
  if (result.count === 0) redirect("/admin/in-use?error=inactive");

  revalidateAdminViews();
  redirect("/admin/in-use?success=returned");
}

export async function setUserActive(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const userId = formString(formData, "userId");
  const activeValue = formString(formData, "active");
  if (!isUuid(userId) || !["true", "false"].includes(activeValue)) {
    redirect("/admin/users?error=invalid");
  }
  if (userId === admin.id && activeValue === "false") {
    redirect("/admin/users?error=self");
  }

  const result = await prisma.user.updateMany({
    where: { id: userId, role: "USER" },
    data: { active: activeValue === "true" },
  });
  if (result.count === 0) redirect("/admin/users?error=missing");

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  redirect(`/admin/users?success=${activeValue === "true" ? "activated" : "deactivated"}`);
}

export async function createManagedUser(formData: FormData) {
  await requireRole("ADMIN");
  const parsed = managedUserSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });
  if (!parsed.success) redirect("/admin/users?error=invalid-fields");

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        role: "USER",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/admin/users?error=duplicate");
    }
    throw error;
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  redirect("/admin/users?success=created");
}
