"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type Booking = {
    id: number;
    activity: {
        id: number;
        title: string;
        location: string;
        price: number;
        imageUrl: string | null;
    };
    bookingDate: string;
    startTime: string;
    status: string;
    isPast: boolean;
};

type BookingCardProps = {
    booking: Booking;
    onCancel?: (id: number) => void;
    onModify?: (id: number, date: string, time: string) => Promise<void>;
    error?: string;
};

const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

export function BookingCard({ booking, onCancel, onModify, error }: BookingCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [modifyDate, setModifyDate] = useState("");
    const [modifyTime, setModifyTime] = useState("");
    const [modifyError, setModifyError] = useState("");
    const [modifyLoading, setModifyLoading] = useState(false);

    const imageSrc = booking.activity.imageUrl ?? "/activities/biarritz-surf-session.jpg";
    const isCancelled = booking.status === "cancelled";
    const date = new Date(booking.bookingDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });

    const today = new Date().toLocaleDateString("en-CA");
    const currentTime = new Date().toTimeString().slice(0, 5);

    const isSlotDisabled = (slot: string) => {
        if (!modifyDate) return true;
        if (modifyDate !== today) return false;
        return slot <= currentTime;
    };

    const handleModifySubmit = async () => {
        if (!modifyDate || !modifyTime) {
            setModifyError("Please select a date and time");
            return;
        }

        if (isSlotDisabled(modifyTime)) {
            setModifyError("Selected time slot is no longer available");
            return;
        }

        setModifyError("");
        setModifyLoading(true);

        try {
            await onModify?.(booking.id, modifyDate, modifyTime);
            setIsEditing(false);
            setModifyDate("");
            setModifyTime("");
        } catch (error) {
            setModifyError(error instanceof Error ? error.message : "Modification failed.");
        } finally {
            setModifyLoading(false);
        }
    };

    return (
        <article className={`booking-card fade-in ${isCancelled ? "booking-card-cancelled" : ""}`}>
            <Link 
                href={`/activity/${booking.activity.id}`} 
                className="booking-media-link" 
                aria-label={`View details for ${booking.activity.title}`}
            >
                <div className="booking-media">
                    <Image
                        src={imageSrc}
                        alt={booking.activity.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="activity-image"
                    />

                    <div className="booking-overlay" />

                    <div className="booking-topline">
                        <span className="eyebrow">{booking.activity.location}</span>
                        <span className={`status-pill ${isCancelled ? "status-pill-cancelled" : "status-pill-active"}`}>
                            {isCancelled ? "Cancelled" : "Confirmed"}
                        </span>
                    </div>

                    <div className="booking-content">
                        <h3 className="booking-title">{booking.activity.title}</h3>
                        <p className="booking-date">{date} at {booking.startTime}</p>
                        <p className="booking-price">{Number(booking.activity.price).toFixed(2)}€</p>
                    </div>
                </div>
            </Link>

            {error && (
                <p style={{ color: "var(--accent)", fontSize: "13px", padding: "8px 16px 0" }}>{error}</p>
            )}

            {!isCancelled && (onCancel || onModify) && (
                <div style={{ padding: "12px 16px", display: "grid", gap: "10px", borderTop: "1px solid var(--line)" }}>
                    {isEditing ? (
                        <>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ fontSize: "13px", color: "var(--muted)" }}>
                                    Select a new date
                                </label>
                                <input
                                    type="date"
                                    min={today}
                                    value={modifyDate}
                                    onChange={(e) => setModifyDate(e.target.value)}
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

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ fontSize: "13px", color: "var(--muted)" }}>
                                    Select a new time slot
                                </label>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {TIME_SLOTS.map((slot) => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setModifyTime(slot)}
                                            disabled={isSlotDisabled(slot)}
                                            className={modifyTime === slot ? "btn-primary" : "btn-secondary"}
                                            style={{ 
                                                minHeight: "36px", 
                                                padding: "0 14px", 
                                                fontSize: "13px",
                                                opacity: isSlotDisabled(slot) ? 0.35 : 1, 
                                                cursor: isSlotDisabled(slot) ? "not-allowed" : "pointer",
                                            }}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {modifyError && (
                                <p style={{ color: "var(--accent)", fontSize: "13px" }}>{modifyError}</p>
                            )}

                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleModifySubmit}
                                    disabled={!modifyDate || !modifyTime || modifyLoading}
                                    style={{ 
                                        minHeight: "40px", 
                                        padding: "0 16px", 
                                        fontSize: "14px", 
                                        opacity: (!modifyDate || !modifyTime || modifyLoading) ? 0.5 : 1 }}
                                >
                                    {modifyLoading ? "Saving..." : "Confirm Changes"}
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    disabled={modifyLoading}
                                    style={{ 
                                        minHeight: "40px",
                                        padding: "0 16px", 
                                        fontSize: "14px" }}
                                    onClick={() => {
                                        setIsEditing(false);
                                        setModifyDate("");
                                        setModifyTime("");
                                        setModifyError("");
                                    }}
                                >
                                    Discard
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: "flex", gap: "8px" }}>
                            {onModify && (
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ 
                                        minHeight: "40px", 
                                        padding: "0 16px", 
                                        fontSize: "14px", 
                                        flex: 1 }}
                                    onClick={() => setIsEditing(true)}
                                >
                                    Modify
                                </button>
                            )}
                            {onCancel && (
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    style={{ 
                                        minHeight: "40px",
                                        padding: "0 16px", 
                                        fontSize: "14px",
                                        flex: 1
                                    }}
                                    onClick={() => onCancel(booking.id)}
                                >
                                    Cancel Booking
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}