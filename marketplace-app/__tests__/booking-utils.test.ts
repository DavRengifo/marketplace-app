import { 
    isSlotAvailable, 
    computeIsCancellable, 
    computeIsPast, 
    isValidBookingDate, 
    isValidStartTime } 
    from "@/lib/booking-utils";

// isSlotAvailable: a time slot is only disabled
// if it's on today's date AND already past
describe("isSlotAvailable", () => {
    const today = "2025-05-11";
    const currentTime = "10:00";

    it("returns false if no date selected", () => {
        const result = isSlotAvailable("12:00", "", today, currentTime);
        expect(result).toBe(false);
    });

    it("returns true for any slot on a future date", () => {
        const result = isSlotAvailable("09:00", "2025-05-12", today, currentTime);
        expect(result).toBe(true);
    });

    it("returns true for a slot after current time today", () => {
        const result = isSlotAvailable("11:00", today, today, currentTime);
        expect(result).toBe(true);
    });

    it("returns false for a slot before current time today", () => {
        const result = isSlotAvailable("09:00", today, today, currentTime);
        expect(result).toBe(false);
    });

    it("returns false for a slot equal to current time today", () => {
        const result = isSlotAvailable("10:00", today, today, currentTime);
        expect(result).toBe(false);
    });

    it("returns false for null date and time", () => {
        const result = isSlotAvailable(null as unknown as string, null as unknown as string, today, currentTime);
        expect(result).toBe(false);
    });

    it("returns false for empty date and time", () => {
        const result = isSlotAvailable("", "", today, currentTime);
        expect(result).toBe(false);
    });

});

// computeIsPast: uses UTC arithmetic
// null inputs return false (caller handles legacy data)
describe("computeIsPast", () => {
    it("returns false when bookingDate is null — caller handles legacy bookings", () => {
        const now = new Date("2026-05-11T00:00:00.000Z");
        const result = computeIsPast(null, "10:00", now);
        expect(result).toBe(false);
    });

    it("returns false when startTime is null", () => {
        const now = new Date("2026-05-11T00:00:00.000Z");
        const bookingDate = new Date("2026-05-20T00:00:00.000Z");
        const result = computeIsPast(bookingDate, null, now);
        expect(result).toBe(false);
    });

    it("returns true for a past booking", () => {
        const bookingDate = new Date("2026-05-10T00:00:00.000Z");
        const now = new Date("2026-05-11T00:00:00.000Z");
        const result = computeIsPast(bookingDate, "10:00", now);
        expect(result).toBe(true);
    });

    it("returns false for a future booking", () => {
        const bookingDate = new Date("2026-05-12T00:00:00.000Z");
        const now = new Date("2026-05-11T00:00:00.000Z");
        const result = computeIsPast(bookingDate, "10:00", now);
        expect(result).toBe(false);
    });

    it("returns true for a booking earlier today", () => {
        const bookingDate = new Date("2026-05-11T00:00:00.000Z");
        const now = new Date("2026-05-11T10:00:00.000Z");
        const result = computeIsPast(bookingDate, "00:01", now);
        expect(result).toBe(true);
    });
    
    it("returns false for a booking later today", () => {
        const bookingDate = new Date("2026-05-11T00:00:00.000Z");
        const now = new Date("2026-05-11T00:00:00.000Z");
        const result = computeIsPast(bookingDate, "23:59", now);
        expect(result).toBe(false);
    });

    it("returns false for a booking exactly at now", () => {
        const bookingDate = new Date("2026-05-11T00:00:00.000Z");
        const now = new Date("2026-05-11T10:00:00.000Z");
        const startTime = `${now.getUTCHours().toString().padStart(2, "0")}:${now.getUTCMinutes().toString().padStart(2, "0")}`;
        // starTime = "10:00"
        const result = computeIsPast(bookingDate, startTime, now);
        // bookingDateTime = 10:00Z, now = 10:00Z → 10:00 < 10:00 = false
        expect(result).toBe(false);
    });  

});

// a booking is cancellable only if now is strictly before
// (activity datetime − cancellationHours)
describe("computeIsCancellable", () => {
    it("returns false when bookingDate is null", () => {
        const result = computeIsCancellable(null, "10:00", 24, new Date("2026-05-11T00:00:00.000Z"));
        expect(result).toBe(false);
    });

    it("returns false when startTime is null", () => {
        const result = computeIsCancellable(new Date("2026-05-11T00:00:00.000Z"), null, 24, new Date("2026-05-11T00:00:00.000Z"));
        expect(result).toBe(false);
    });
    
    it("returns true when cancellation deadline is in the future", () => {
        const bookingDate = new Date("2026-05-12T00:00:00.000Z");
        const result = computeIsCancellable(bookingDate, "10:00", 24, new Date("2026-05-11T00:00:00.000Z"));
        expect(result).toBe(true);
    });

    it("returns false when cancellation deadline has passed", () => {
        const bookingDate = new Date("2026-05-11T00:00:00.000Z");
        const result = computeIsCancellable(bookingDate, "10:00", 24, new Date("2026-05-11T12:00:00.000Z"));
        expect(result).toBe(false);
    });

    it("returns false when exactly at cancellation deadline — deadline is exclusive", () => {
        const bookingDate = new Date("2026-05-12T00:00:00.000Z");
        const result = computeIsCancellable(bookingDate, "10:00", 24, new Date("2026-05-11T10:00:00.000Z"));
        expect(result).toBe(false);
    });

    it("returns true when well within cancellation window", () => {
        const bookingDate = new Date("2026-05-20T00:00:00.000Z");
        const result = computeIsCancellable(bookingDate, "10:00", 24, new Date("2026-05-11T00:00:00.000Z"));
        expect(result).toBe(true);
    });

});

// validates HH:MM format: two-digit hour (00–23) and two-digit minute (00–59)
describe("isValidStartTime", () => {
    it("returns false for null", () => {
        expect(isValidStartTime(null)).toBe(false);
    });

    it("returns false for empty string", () => {
        expect(isValidStartTime("")).toBe(false);
    });

    it("returns false for invalid format", () => {
        expect(isValidStartTime("10")).toBe(false);
        expect(isValidStartTime("10:")).toBe(false);
        expect(isValidStartTime("10:0")).toBe(false);
        expect(isValidStartTime("24:00")).toBe(false);
        expect(isValidStartTime("12:60")).toBe(false);
    });

    it("returns true for valid times", () => {
        expect(isValidStartTime("00:00")).toBe(true);
        expect(isValidStartTime("09:30")).toBe(true);
        expect(isValidStartTime("23:59")).toBe(true);
    });

    it("returns false for non-string input", () => {
        expect(isValidStartTime(123 as unknown as string)).toBe(false);
        expect(isValidStartTime({} as unknown as string)).toBe(false);
    });

    it("returns true for midnight", () => {
        expect(isValidStartTime("00:00")).toBe(true);
    });

    it("returns true for noon", () => {
        expect(isValidStartTime("12:00")).toBe(true);
    });

    it("returns true for last valid time", () => {
        expect(isValidStartTime("23:59")).toBe(true);
    });

    it("returns false for 24:00", () => {
        expect(isValidStartTime("24:00")).toBe(false);
    });

    it("returns false for single digit hour", () => {
        expect(isValidStartTime("9:00")).toBe(false);
    });

    it("returns false for single digit minute", () => {
        expect(isValidStartTime("09:0")).toBe(false);
    });

});

// validates YYYY-MM-DD strings. 
// Rejects null, empty, out-of-range months/days, and non-date strings
describe("isValidBookingDate", () => {
    it("returns false for null", () => {
        expect(isValidBookingDate(null)).toBe(false);
    });

    it("returns false for empty string", () => {
        expect(isValidBookingDate("")).toBe(false);
    });

    it("returns false for invalid date", () => {
        expect(isValidBookingDate("2025-13-01")).toBe(false);
        expect(isValidBookingDate("2025-00-01")).toBe(false);
        expect(isValidBookingDate("2025-01-32")).toBe(false);
        expect(isValidBookingDate("invalid-date")).toBe(false);
    });

    it("returns true for valid date", () => {
        expect(isValidBookingDate("2025-05-11")).toBe(true);
        expect(isValidBookingDate("2026-12-31")).toBe(true);
    });

    it("returns false for an invalid string", () => {
        expect(isValidBookingDate("not-a-date")).toBe(false);
    });

});