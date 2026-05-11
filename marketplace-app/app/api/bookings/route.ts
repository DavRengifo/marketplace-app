import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json([], { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      activity: {
        select: {
            id: true,
            title: true,
            location: true,
            price: true,
            imageUrl: true,
            cancellation: true,
        },
      },
    },
    orderBy: {bookingDate: "asc"},
  });

  const now = new Date();

  const withMeta = bookings.map((booking) => {
    let isPast: boolean;
    if (!booking.bookingDate) {
      isPast = true;
    } else if (!booking.startTime) {
      const endOfDay = new Date(booking.bookingDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      isPast = endOfDay < now;
    } else {
      const [hours, minutes] = booking.startTime.split(":").map(Number);
      const activityDatetime = new Date(booking.bookingDate);
      activityDatetime.setUTCHours(hours, minutes, 0, 0);
      isPast = activityDatetime < now;
    }
    return { ...booking, isPast };
  });

  return Response.json(withMeta);
}
