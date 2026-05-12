import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { randomUUID } from "crypto";

export async function POST (
    req: Request,
) {
    const session = await auth();

    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
        return Response.json({ error: "Missing bookingId" }, { status: 400 });
    }   
    
    const booking = await prisma.booking.findUnique({
        where: { id: Number(bookingId) },
        include: { 
            activity: {
                select: {
                    title: true,
                    price: true,
                },
            },
        } 
    });
    
    if (!booking || booking.userId !== session.user.id) {
        return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "cancelled") {
        return Response.json({ error: "Booking is already cancelled" }, { status: 400 });
    }

    if (booking.status === "confirmed") {
        return Response.json({ error: "Booking is already paid" }, { status: 400 });
    }

    const existingPayment = await prisma.payment.findUnique({
        where: { bookingId: Number(bookingId) },
    });

    if (existingPayment?.status === "paid") {
        return Response.json({ error: "Booking is already paid" }, { status: 400 });
    }

    const stripeSessionId = `cs_sim_${randomUUID().replace(/-/g, "")}`;

    const payment = await prisma.payment.upsert({
        where: { bookingId: Number(bookingId) },
        update: { status: "pending", stripeSessionId },
        create: {
            bookingId: Number(bookingId),
            userId: session.user.id,
            amount: booking.activity.price,
            currency: "EUR",
            status: "pending",
            stripeSessionId,
            paymentMethod: "card",
        },
    });

    return Response.json({
        activityTitle: booking.activity.title,
        stripeSessionId: payment.stripeSessionId,
        amount: Number(payment.amount),
        currency: payment.currency,
    });
}