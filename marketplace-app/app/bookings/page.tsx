"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { BookingCard, type Booking } from "@/components/BookingCard";

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [cancelErrors, setCancelErrors] = useState<{ [key: number]: string }>({});

  const isLoading = status === "loading" || (status === "authenticated" && bookings === null);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    fetch("/api/bookings")
      .then((response) => response.json())
      .then((data) => {
          setBookings(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Failed to fetch bookings", error);
        setBookings([]);
      });
  }, [session, status]);

  const handleCancel = async (bookingId: number) => { 
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

        if (!response.ok) {
            const data = await response.json();
            setCancelErrors((prev) => ({ 
                ...prev,
                [bookingId]: data.error?? "Cancellation failed",
            }));
            return;
        }

        setBookings((prev) =>
            (prev ?? []).map((booking) =>
                booking.id === bookingId ? { ...booking, status: "cancelled" } : booking
            )
        );
        setCancelErrors((prev) => {
          const next = { ...prev };
          delete next[bookingId];
          return next;
        });
    } catch (error) {
      console.error("Failed to cancel booking", error);
      setCancelErrors((prev) => ({
        ...prev,
        [bookingId]: "Cancellation failed",
      }));
    }
  };

  const handleModify = async (bookingId: number, date: string, time: string) => {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingDate: date, startTime: time }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? "Modification failed");
    }

    setBookings((prev) =>
      (prev ?? []).map((booking) =>
        booking.id === bookingId
          ? { ...booking, bookingDate: date, startTime: time }
          : booking
      )
    );
  };

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="section-block">
          <p style={{ color: "var(--muted)" }}>Loading your bookings…</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page-shell">
        <section className="section-block">
          <p style={{ color: "var(--muted)" }}>Please <button className="btn-link" onClick={() => signIn("github")}>sign in</button> to view your bookings.</p>
        </section>
      </main>
    );
  }

  const bookingList = bookings ?? [];
  
  return (
    <main className="page-shell">
      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your account</p>
            <h2>My Bookings</h2>
          </div>
          <Link href="/" className="btn-secondary">← Browse experiences</Link>
        </div>

        {bookingList.length === 0 ? (
          <div className="empty-state">
            <p className="eyebrow">Nothing here yet</p>
            <h3>You have not booked any experiences.</h3>
            <Link href="/" className="btn-primary">Explore experiences</Link>
          </div>
        ) : (
          <>
            <div className="bookings-list">
              {bookingList
                .filter((b) => b.status !== "cancelled")
                .map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={handleCancel}
                    onModify={handleModify}
                    error={cancelErrors[booking.id]}
                  />
                ))}
            </div>

            {bookingList.some((b) => b.status === "cancelled") && (
              <>
                <p className="eyebrow" style={{ marginTop: "40px" }}>Past cancellations</p>
                <div className="bookings-list">
                  {bookingList
                    .filter((b) => b.status === "cancelled")
                    .map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
