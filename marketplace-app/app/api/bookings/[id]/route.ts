import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function DELETE(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const booking = await prisma.booking.findUnique({
        where: { id: Number(id) },
        include: { 
            activity: {
                select: {
                    id: true,
                    cancellation: true,
                },
            },
        },
    });

    if (!booking || booking.userId !== session.user.id) {
        return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "cancelled") {
        return Response.json({ error: "Booking is already cancelled" }, { status: 400 });
    }

    if (booking.bookingDate) {
        const hoursMatch = booking.activity.cancellation?.match(/(\d+)\s*hours?/i);
        const cancellationHours = hoursMatch ? parseInt(hoursMatch[1]) : 24;
        const deadline = new Date(booking.bookingDate.getTime() - cancellationHours * 60 * 60 * 1000);

        if (new Date() > deadline) {
            return Response.json(
                { error: `Cancellation deadline has passed (${cancellationHours} hours before start time)` },
                { status: 400 }
            );
        }
    }

    await prisma.booking.update({
        where: { id: Number(id) },
        data: { status: "cancelled" },
    });

    await prisma.activity.update({
        where: { id: booking.activity.id },
        data: {
            bookingCount: {
                decrement: 1,
            },
        },
    });

    return Response.json({ success: true });
}

export async function PATCH (
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { bookingDate, startTime } = await req.json();

    if (!bookingDate || !startTime) {
        return Response.json({ error: "Missing required fields: bookingDate or startTime" }, { status: 400 });
    }

    const date = new Date(bookingDate);
    if (isNaN(date.getTime())) {
        return Response.json({ error: "Invalid bookingDate format" }, { status: 400 });
    }

    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timePattern.test(startTime)) {
        return Response.json({ error: "Invalid startTime format, expected HH:mm" }, { status: 400 });
    }

    if (date < new Date()) {
        return Response.json({ error: "Booking date must be in the future" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
        where: { id: Number(id) },
        include: { 
            activity: { select: { id: true, cancellation: true} },
        },
    });

    if (!booking || booking.userId !== session.user.id) {
        return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "cancelled") {
        return Response.json({ error: "Cannot modify a cancelled booking" }, { status: 400 });
    }

    if (booking.bookingDate) {
        const hoursMatch = booking.activity.cancellation?.match(/(\d+)\s*hours?/i);
        const cancellationHours = hoursMatch ? parseInt(hoursMatch[1]) : 24;
        const deadline = new Date(booking.bookingDate.getTime() - cancellationHours * 60 * 60 * 1000);

        if (new Date() > deadline) {
            return Response.json(
                { error: `Modification deadline has passed (${cancellationHours} hours before start time)` },
                { status: 400 }
            );
        }
    }

    const updatedBooking = await prisma.booking.update({
        where: { id: Number(id) },
        data: {
            bookingDate: date,
            startTime,
        },
    });

    return Response.json({ success: true, booking: updatedBooking });
}
