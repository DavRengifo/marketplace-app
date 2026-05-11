import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingDate, startTime } = await req.json();

  if (!bookingDate || !startTime) {
    return Response.json(
      { error: "Missing required bookingDate or startTime" },
      { status: 400 }
    );
  }

  const date= new Date(bookingDate);

  if (isNaN(date.getTime())) {
    return Response.json(
      { error: "Invalid bookingDate format" },
      { status: 400 }
    );
  }

  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime)) {
    return Response.json(
      { error: "Invalid startTime format" },
      { status: 400 }
    );
  }
  
  if (date < new Date()) {
    return Response.json(
      { error: "Booking date must be in the future" },
      { status: 400 }
    );
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
      bookingDate: date,
      startTime,
    },
  });

  // cache invalidation
  await redis.incr("activities:version");

  return Response.json(activity);
}