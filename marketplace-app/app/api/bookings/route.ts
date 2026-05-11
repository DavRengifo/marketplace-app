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

  return Response.json(bookings);
}
