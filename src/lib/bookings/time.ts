import { addHours, format, startOfHour } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const BOOKING_TIME_ZONE = "Asia/Colombo";

export function getDefaultColomboBookingTimes(now = new Date()) {
  const nextHour = addHours(startOfHour(toZonedTime(now, BOOKING_TIME_ZONE)), 1);
  return {
    startAt: format(nextHour, "yyyy-MM-dd'T'HH:mm"),
    endAt: format(addHours(nextHour, 1), "yyyy-MM-dd'T'HH:mm"),
  };
}

export function colomboTimeToUtc(localTime: string) {
  return fromZonedTime(localTime, BOOKING_TIME_ZONE);
}
