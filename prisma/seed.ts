import { PrismaClient, Role, BookingStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [adminPassword, userPassword] = await Promise.all([
    hash("Admin@123", 12),
    hash("User@123", 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: { name: "PrimeWave Admin", passwordHash: adminPassword, role: Role.ADMIN },
    create: {
      name: "PrimeWave Admin",
      email: "admin@demo.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });
  const user = await prisma.user.upsert({
    where: { email: "user@demo.com" },
    update: { name: "Demo User", passwordHash: userPassword, role: Role.USER },
    create: {
      name: "Demo User",
      email: "user@demo.com",
      passwordHash: userPassword,
      role: Role.USER,
    },
  });

  const categoryDefinitions = [
    { name: "Rooms", slug: "rooms", description: "Meeting and collaboration spaces." },
    { name: "Equipment", slug: "equipment", description: "Shared lab and presentation equipment." },
    { name: "Vehicles", slug: "vehicles", description: "Vehicles available for organization use." },
  ];
  const categories = await Promise.all(
    categoryDefinitions.map(({ slug, ...data }) =>
      prisma.category.upsert({ where: { slug }, update: data, create: { ...data, slug } }),
    ),
  );
  const bySlug = new Map(categories.map((category) => [category.slug, category]));

  const resourceDefinitions = [
    { category: "rooms", name: "Innovation Room", details: "Seats 10" },
    { category: "rooms", name: "Focus Room", details: "Seats 4" },
    { category: "rooms", name: "Conference Room", details: "Seats 16" },
    { category: "rooms", name: "Workshop Studio", details: "Seats 20" },
    { category: "equipment", name: "4K Projector", details: "HDMI and USB-C" },
    { category: "equipment", name: "Portable PA System", details: "Wireless microphone included" },
    { category: "equipment", name: "Mirrorless Camera Kit", details: "Camera, lens, and tripod" },
    { category: "equipment", name: "Conference Speakerphone", details: "USB and Bluetooth" },
    { category: "vehicles", name: "Pool Car", details: "Seats 5" },
    { category: "vehicles", name: "Electric Van", details: "Seats 7" },
  ];
  const resources = await Promise.all(
    resourceDefinitions.map(({ category, ...data }) => {
      const categoryRecord = bySlug.get(category);
      if (!categoryRecord) throw new Error(`Seed category "${category}" was not created.`);
      return prisma.resource.upsert({
        where: { categoryId_name: { categoryId: categoryRecord.id, name: data.name } },
        update: data,
        create: { ...data, categoryId: categoryRecord.id },
      });
    }),
  );

  const existingBookings = await prisma.booking.count();
  if (existingBookings === 0) {
    const now = Date.now();
    const demoBookings = [
      { resource: resources[0], owner: user, startHours: 3, durationHours: 2, purpose: "Product planning" },
      { resource: resources[4], owner: admin, startHours: 8, durationHours: 4, purpose: "Quarterly presentation" },
      { resource: resources[8], owner: user, startHours: 28, durationHours: 5, purpose: "Off-site visit" },
    ];
    await prisma.booking.createMany({
      data: demoBookings.map(({ resource, owner, startHours, durationHours, purpose }) => ({
        userId: owner.id,
        resourceId: resource.id,
        startAt: new Date(now + startHours * 60 * 60 * 1000),
        endAt: new Date(now + (startHours + durationHours) * 60 * 60 * 1000),
        purpose,
        status: BookingStatus.BOOKED,
      })),
    });
  }

  console.info(`Seeded ${admin.email}, ${user.email}, ${resources.length} resources, and demo bookings.`);
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
