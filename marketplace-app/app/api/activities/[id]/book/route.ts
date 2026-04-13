import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  // cache invalidation
  await redis.incr("activities:version");

  return Response.json(activity);
}