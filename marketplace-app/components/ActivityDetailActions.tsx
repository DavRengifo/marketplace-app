"use client";

import { useEffect, useState } from "react";

type ActivityDetailActionsProps = {
  activityId: number;
  title: string;
  location: string;
  category: string;
  price: number;
  initialBookingCount: number;
};

export function ActivityDetailActions({
  activityId,
  title,
  location,
  category,
  price,
  initialBookingCount,
}: ActivityDetailActionsProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookingCount, setBookingCount] = useState(initialBookingCount);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("favorites") ?? "[]") as number[];
    const booked = JSON.parse(localStorage.getItem("bookedActivities") ?? "[]") as number[];

    setIsFavorite(favorites.includes(activityId));
    setIsBooked(booked.includes(activityId));
  }, [activityId]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem("favorites") ?? "[]") as number[];
    const nextFavorites = favorites.includes(activityId)
      ? favorites.filter((favoriteId) => favoriteId !== activityId)
      : [...favorites, activityId];

    localStorage.setItem("favorites", JSON.stringify(nextFavorites));
    setIsFavorite(nextFavorites.includes(activityId));
  };

  const handleBooking = async () => {
    if (isBooked) {
      return;
    }

    setIsBooked(true);
    setBookingCount((current) => current + 1);

    const booked = JSON.parse(localStorage.getItem("bookedActivities") ?? "[]") as number[];
    localStorage.setItem("bookedActivities", JSON.stringify([...new Set([...booked, activityId])]));

    try {
      const response = await fetch(`/api/activities/${activityId}/book`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Booking failed");
      }
    } catch (error) {
      console.error("Booking failed", error);
      const nextBooked = booked.filter((bookedId) => bookedId !== activityId);
      localStorage.setItem("bookedActivities", JSON.stringify(nextBooked));
      setIsBooked(false);
      setBookingCount((current) => Math.max(initialBookingCount, current - 1));
    }
  };

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
          className={isFavorite ? "favorite-chip favorite-chip-active" : "favorite-chip"}
          aria-pressed={isFavorite}
        >
          {isFavorite ? "Saved" : "Save"}
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
        <button type="button" onClick={handleBooking} className={isBooked ? "btn-success" : "btn-primary"}>
          {isBooked ? "Booked" : "Book this experience"}
        </button>
        <p className="detail-action-note">
          {title} is now ready for favorite persistence and booking feedback directly from the detail page.
        </p>
      </div>
    </aside>
  );
}
