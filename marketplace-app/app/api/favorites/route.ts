import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { activityId: true },
  });

  return Response.json(favorites.map((f) => f.activityId));
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { activityId } = await req.json();

  await prisma.favorite.upsert({
    where: {
      userId_activityId: {
        userId: session.user.id,
        activityId,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      activityId,
    },
  });

  return Response.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { activityId } = await req.json();

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, activityId },
  });

  return Response.json({ success: true });
}