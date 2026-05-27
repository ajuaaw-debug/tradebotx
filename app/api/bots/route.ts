import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      botInstances: {
        include: {
          strategy: true,
          exchangeConn: true,
          trades: {
            where: { tradeStatus: "OPEN" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return NextResponse.json({ data: [] });
  return NextResponse.json({ data: user.botInstances });
}