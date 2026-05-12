"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type CheckoutBooking = {
    id: number;
    activity: { title: string; price: number; location: string };
    bookingDate: string;
    startTime: string;
    status: string;
};

export default function CheckoutPage() {
    const { bookingId } = useParams();
    const router = useRouter();
    const { status } = useSession();
    const [booking, setBooking] = useState<CheckoutBooking | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<"idle" | "loading" | "error">("idle");
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "loading") return;
        if (status === "unauthenticated") signIn();
    }, [status]);

    useEffect(() => {
        if (status !== "authenticated") return;
        fetch("/api/bookings")
            .then((response) => response.json())
            .then((data) => {
                const found = data.find((b: CheckoutBooking) => b.id === Number(bookingId));
                if (!found) setError("Booking not found");
                else setBooking(found);
            })
            .catch(() => setError("Failed to load booking"));
    }, [bookingId, status]);

    const handlePay = async () => {
        setPaymentStatus("loading");
        setError("");
        try {
            const checkoutResponse = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId }),
            });
            if (!checkoutResponse.ok) {
                const data = await checkoutResponse.json();
                throw new Error(data.error ?? "Payment initiation failed");
            }
            const { stripeSessionId } = await checkoutResponse.json();

            const webhookResponse = await fetch("/api/webhook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stripeSessionId }),
            });
            if (!webhookResponse.ok) {
                const data = await webhookResponse.json();
                throw new Error(data.error ?? "Payment confirmation failed");
            }

            router.push("/bookings");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Unexpected error");
            setPaymentStatus("error");
        }
    };

    if (status === "loading" || (status === "authenticated" && !booking && !error)) {
        return (
            <main className="page-shell">
                <section className="section-block">
                    <p style={{ color: "var(--muted)" }}>Loading…</p>
                </section>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page-shell">
                <section className="section-block">
                    <p style={{ color: "var(--accent)", marginBottom: "16px" }}>{error}</p>
                    <Link href="/bookings" className="btn-secondary">← My Bookings</Link>
                </section>
            </main>
        );
    }

    if (!booking) return null;

    if (booking.status === "confirmed") {
        return (
            <main className="page-shell">
                <section className="section-block">
                    <div className="btn-success" style={{ textAlign: "center", padding: "14px", marginBottom: "16px" }}>
                        ✓ This booking is already paid.
                    </div>
                    <Link href="/bookings" className="btn-secondary">← My Bookings</Link>
                </section>
            </main>
        );
    }

    const date = new Date(booking.bookingDate).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    });

    return (
        <main className="page-shell">
            <section className="section-block" style={{ maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Secure checkout</p>
                        <h2>Confirm & Pay</h2>
                    </div>
                    <Link href="/bookings" className="btn-secondary">← Back</Link>
                </div>

                <aside className="activity-detail-panel" style={{ marginTop: "24px" }}>
                    <div className="detail-actions-header">
                        <div>
                            <p className="price-caption">Total due</p>
                            <p className="activity-price">{Number(booking.activity.price).toFixed(2)}€</p>
                        </div>
                    </div>

                    <div className="activity-detail-facts">
                        <div>
                            <span>Experience</span>
                            <strong>{booking.activity.title}</strong>
                        </div>
                        <div>
                            <span>Date</span>
                            <strong>{date} at {booking.startTime}</strong>
                        </div>
                        <div>
                            <span>Location</span>
                            <strong>{booking.activity.location}</strong>
                        </div>
                    </div>

                    <div className="detail-action-stack">
                        {error && (
                            <p style={{ color: "var(--accent)", fontSize: "13px" }}>{error}</p>
                        )}
                        <button
                            className="btn-primary"
                            onClick={handlePay}
                            disabled={paymentStatus === "loading"}
                            style={{ opacity: paymentStatus === "loading" ? 0.5 : 1 }}
                        >
                            {paymentStatus === "loading" ? "Processing payment…" : "Pay now"}
                        </button>
                        <p className="detail-action-note">
                            Simulated payment — no real charge will be made.
                        </p>
                    </div>
                </aside>
            </section>
        </main>
    );
}
