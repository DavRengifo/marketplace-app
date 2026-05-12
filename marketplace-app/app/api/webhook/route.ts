import { prisma } from "@/lib/prisma";

export async function POST (
    req: Request,
) {

    const { stripeSessionId } = await req.json();
    if (!stripeSessionId) {
        return Response.json({ error: "Missing stripeSessionId" }, { status: 400 });
    } 
    
    // Production: replace req.json() with req.text() + stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
    // to verify the request is genuinely from Stripe, then check event.type === "checkout.session.completed"
    // and extract data from event.data.object. Stripe retries on non-200 — always return { received: true }.
    
    const payment = await prisma.payment.findUnique({
        where: { stripeSessionId: stripeSessionId },
    });

    if (!payment) {
        return Response.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "paid") {
        return Response.json({ success: true });
    }

    await prisma.$transaction(async (prisma) => {
        await prisma.payment.update({
            where: { stripeSessionId: stripeSessionId },
            data: { status: "paid" },
        });

        await prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: "confirmed" },
        });
    });

    return Response.json({ success: true });
}