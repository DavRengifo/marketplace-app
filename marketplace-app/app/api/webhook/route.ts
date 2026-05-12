import { prisma } from "@/lib/prisma";

export async function POST (
    req: Request,
) {

    const { stripeSessionId } = await req.json();
    if (!stripeSessionId) {
        return Response.json({ error: "Missing stripeSessionId" }, { status: 400 });
    } 
    
    // In production, I would verify the webhook signature and event type here
    // using Stripe's SDK and my webhook secret, then update the payment and booking status accordingly.
    // Production: stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
    // Process: read raw body with req.text(), then give it to stripe.webhooks.constructEvent()
    // with the signature and webhook secret, finally extract data from event.data.object rather than the body.
    // This ensures that only Stripe can confirm a payment.
    // We also verify that event.type === 'checkout.session.completed' since Stripe sends many different events 
    // and retries if you return anything other than a 200."
    
    const payment = await prisma.payment.findUnique({
        where: { stripeSessionId: stripeSessionId },
    });

    if (!payment) {
        return Response.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "paid") {
        return Response.json({ success: true });
    }

    // Atomic architecture: 
    // Update the payment status and booking status 
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