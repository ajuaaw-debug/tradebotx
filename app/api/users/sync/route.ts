import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {
      email: user.emailAddresses[0]?.emailAddress ?? "",
      fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      avatarUrl: user.imageUrl,
    },
    create: {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      avatarUrl: user.imageUrl,
    },
  });

  return NextResponse.json({ ok: true });
}