export function isSlotAvailable(
    slot: string,
    selectedDate: string,
    today: string,
    currentTime: string
) : boolean {
    if (!selectedDate) return false;
    if (selectedDate !== today) return true;
    return slot > currentTime;
}

export function computeIsPast(
    bookingDate: Date | null,
    startTime: string | null,
    now: Date
): boolean {
    // null date/time means no schedule yet — caller decides how to handle
    if (!bookingDate || !startTime) return false;

    const [hours, minutes] = startTime.split(":").map(Number);
    const bookingDateTime = new Date(bookingDate);
    bookingDateTime.setUTCHours(hours, minutes, 0, 0);

    return bookingDateTime < now;
}

export function computeIsCancellable(
    bookingDate: Date | null,
    startTime: string | null,
    cancellationHours: number,
    now: Date
): boolean {
    if (!bookingDate || !startTime) return false;

    const [hours, minutes] = startTime.split(":").map(Number);
    const bookingDateTime = new Date(bookingDate);
    bookingDateTime.setUTCHours(hours, minutes, 0, 0);

    const cancellationDeadline = new Date(bookingDateTime.getTime() - cancellationHours * 60 * 60 * 1000);
    return now < cancellationDeadline;
}

export function isValidStartTime(startTime: string | null): boolean {
    if (!startTime) return false;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(startTime);
}

export function isValidBookingDate(bookingDate: string | null): boolean {
    if (!bookingDate) return false;
    const date = new Date(bookingDate);
    return !isNaN(date.getTime());
}