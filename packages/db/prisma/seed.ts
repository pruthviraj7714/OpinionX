import { hash } from "bcryptjs";
import { prisma } from "..";

async function seedDB() {
  await prisma.user.deleteMany({
    where: {
      role: "ADMIN",
    },
  });
  console.log("deleted previous admins");

  const hashedPassword = await hash(process.env.ADMIN_PASSWORD || '', 10);

  //seeding admin
  await prisma.user.create({
    data: {
      username: process.env.ADMIN_USERNAME || "",
      password: hashedPassword,
      email: process.env.ADMIN_EMAIL || "",
      role: "ADMIN",
    },
  });
  console.log("admin seeded successfully in db");
}

seedDB();
