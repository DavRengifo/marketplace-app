import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { auth } from "@/auth";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // increment bookingCount
  const activity = await prisma.activity.update({
    where: { id: Number(id) },
    data: {
      bookingCount: {
        increment: 1,
      },
    },
  });

  await prisma.booking.create({
    data: {
      userId: session.user.id,
      activityId: Number(id),
    },
  });

  // cache invalidation
  await redis.incr("activities:version");

  return Response.json(activity);
}