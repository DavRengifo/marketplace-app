"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

type ActivityDetailActionsProps = {
  activityId: number;
  location: string;
  category: string;
  price: number;
  initialBookingCount: number;
};

export function ActivityDetailActions({
  activityId,
  location,
  category,
  price,
  initialBookingCount,
}: ActivityDetailActionsProps) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookingCount, setBookingCount] = useState(initialBookingCount);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;

    fetch("/api/favorites")
      .then((response) => response.json())
      .then((ids) => {
        if (Array.isArray(ids)) {
          setIsFavorite(ids.includes(activityId));
        }
      })
      .catch((error) => {
        console.error("Failed to fetch favorites", error);
      });

    fetch("/api/bookings")
      .then((response) => response.json())
      .then((bookings) => {
        if (Array.isArray(bookings)) {
          setIsBooked(
            bookings.some(
              (booking: {activity: {id: number}; status: string }) => 
                booking.activity.id === activityId && booking.status !== "cancelled"
            )
          );
        }
      })
      .catch((error) => {
        console.error("Failed to fetch bookings", error);
      });
  }, [session, activityId]);

  const toggleFavorite = () => {
    if (!session) {
      signIn("github");
      return;
    }
    const next = !isFavorite;
    setIsFavorite(next);

    fetch("/api/favorites", {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId }),
    }).catch((error) => {
      console.error("Favorite toggle error:", error);
      setIsFavorite(!next);
    });
  };

  const handleBooking = async () => {

    if (!session) {
      signIn("github");
      return;
    }

    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time slot for your booking.");
      return;
    }
    setError("");

    if (isBooked) {
      return;
    }

    setIsBooked(true);
    setBookingCount((current) => current + 1);

    try {
      const response = await fetch(`/api/activities/${activityId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingDate: selectedDate,
          startTime: selectedTime,
        }),
      });

      if (!response.ok) {
          const data = await response.json();
          setError(data.error ?? "Booking failed. Please try again.");
          setIsBooked(false);
          setBookingCount((current) => Math.max(initialBookingCount, current - 1));
          return;
      }
    } catch (error) {
      console.error("Booking failed", error);
      setError("An unexpected error occurred. Please try again.");
      setIsBooked(false);
      setBookingCount((current) => Math.max(initialBookingCount, current - 1));
    }
  };

  const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
  const today = new Date().toLocaleDateString("en-CA");
  const currentTime = new Date().toTimeString().slice(0, 5);

  const isSlotDisabled = (slot: string) => {
    if (!selectedDate) return true;
    if (selectedDate !== today) return false;
    return slot <= currentTime;
  };
  const displayIsFavorite = !!session && isFavorite;
  const displayIsBooked = !!session && isBooked;


  return (
    <aside className="activity-detail-panel">
      <div className="detail-actions-header">
        <div>
          <p className="price-caption">Starting from</p>
          <p className="activity-price">{price.toFixed(2)}€</p>
        </div>

        <button
          type="button"
          onClick={toggleFavorite}
          className={displayIsFavorite ? "favorite-chip favorite-chip-active" : "favorite-chip"}
          aria-pressed={displayIsFavorite}
        >
          {displayIsFavorite ? "Saved" : "Save"}
        </button>
      </div>

      <div className="activity-detail-facts">
        <div>
          <span>Location</span>
          <strong>{location}</strong>
        </div>

        <div>
          <span>Category</span>
          <strong>{category}</strong>
        </div>

        <div>
          <span>Popularity</span>
          <strong>{bookingCount} bookings</strong>
        </div>
      </div>

      <div className="detail-action-stack">
        {!displayIsBooked ? (
          <>
            <div>
              <label style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                Select a date
              </label>
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--surface-strong)",
                  fontSize: "14px",
                  color: "var(--foreground)",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
                Select a time slot
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    disabled={isSlotDisabled(slot)}
                    className={selectedTime === slot ? "btn-primary" : "btn-secondary"}
                    style={{ 
                      minHeight: "36px", 
                      padding: "0 16px", 
                      fontSize: "14px",
                      opacity: isSlotDisabled(slot) ? 0.35 : 1, 
                      cursor: isSlotDisabled(slot) ? "not-allowed" : "pointer",
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p style={{ color: "var(--accent)", fontSize: "13px" }}>{error}</p>
            )}

            <button
              type="button"
              onClick={handleBooking}
              disabled={!selectedDate || !selectedTime}
              className="btn-primary"
              style={{ opacity: (!selectedDate || !selectedTime) ? 0.5 : 1 }}
            >
              Book this experience
            </button>
          </>
          ) : selectedDate ? (
            <div className="btn-success" style={{ textAlign: "center", padding: "14px" }}>
              ✓ Booked for {new Date(selectedDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })} at {selectedTime}
            </div>
          ) : (
            <div className="btn-success" style={{ textAlign: "center", padding: "14px" }}>
              ✓ You already booked this experience.{" "}
              <a href="/bookings" style={{ textDecoration: "underline" }}>View my bookings →</a>
            </div>
        )}

        <p className="detail-action-note">
          Free cancellation up to 24 hours before the experience.
        </p>
      </div>
    </aside>
  );
}
