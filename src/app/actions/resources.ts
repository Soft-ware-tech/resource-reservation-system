"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/db";
import { categorySchema, resourceSchema } from "@/lib/validation/resources";

export type ResourceActionState = { error?: string; success?: string };

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function saveCategory(
  _previousState: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  await requireRole("ADMIN");
  const parsed = categorySchema.safeParse({
    id: formString(formData, "id"),
    name: formString(formData, "name"),
    description: formString(formData, "description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the category fields." };

  const name = parsed.data.name;
  const slug = slugify(name);
  if (!slug) return { error: "Use a category name that includes letters or numbers." };

  try {
    if (parsed.data.id) {
      await prisma.category.update({
        where: { id: parsed.data.id },
        data: { name, slug, description: parsed.data.description || null },
      });
    } else {
      await prisma.category.create({
        data: { name, slug, description: parsed.data.description || null },
      });
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: "A category with this name already exists." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "This category no longer exists. Refresh and try again." };
    }
    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/resources");
  revalidatePath("/user");
  return { success: parsed.data.id ? "Category updated." : "Category created." };
}

export async function deleteCategory(
  _previousState: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  await requireRole("ADMIN");
  const id = formString(formData, "id");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "Choose a valid category." };
  }

  const category = await prisma.category.findUnique({
    where: { id },
    select: { _count: { select: { resources: true } } },
  });
  if (!category) return { error: "This category no longer exists." };
  if (category._count.resources > 0) {
    return { error: "Move or delete this category's resources before deleting the category." };
  }

  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "This category no longer exists." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { error: "This category is still in use and cannot be deleted." };
    }
    throw error;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/user");
  return { success: "Category deleted." };
}

export async function saveResource(
  _previousState: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  await requireRole("ADMIN");
  const parsed = resourceSchema.safeParse({
    id: formString(formData, "id"),
    name: formString(formData, "name"),
    categoryId: formString(formData, "categoryId"),
    description: formString(formData, "description"),
    details: formString(formData, "details"),
    imageUrl: formString(formData, "imageUrl"),
    active: formData.has("active") ? "true" : "false",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the resource fields." };

  const data = {
    name: parsed.data.name,
    categoryId: parsed.data.categoryId,
    description: parsed.data.description || null,
    details: parsed.data.details || null,
    imageUrl: parsed.data.imageUrl || null,
    active: parsed.data.active === "true",
  };

  try {
    if (parsed.data.id) {
      await prisma.resource.update({ where: { id: parsed.data.id }, data });
    } else {
      await prisma.resource.create({ data });
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "A resource with this name already exists in that category." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "The resource or selected category no longer exists. Refresh and try again." };
    }
    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/resources");
  revalidatePath("/user");
  revalidatePath("/user/categories/[slug]", "page");
  return { success: parsed.data.id ? "Resource updated." : "Resource created." };
}

export async function deleteResource(formData: FormData) {
  await requireRole("ADMIN");
  const id = formString(formData, "id");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    redirect("/admin/resources?error=invalid");
  }

  try {
    await prisma.resource.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      redirect("/admin/resources?error=missing");
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      redirect("/admin/resources?error=bookings");
    }
    throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/resources");
  revalidatePath("/user");
  revalidatePath("/user/categories/[slug]", "page");
  redirect("/admin/resources?success=deleted");
}
