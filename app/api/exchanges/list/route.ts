import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        exchangeConnections: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            exchange: true,
            label: true,
            mode: true,
            isActive: true,
            verifiedAt: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ data: user?.exchangeConnections ?? [] });
  } catch (error) {
    console.error("Exchange list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}