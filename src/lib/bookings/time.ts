import { addHours, format, startOfHour } from "date-fns";
import { fromZonedTime, formatInTimeZone, toZonedTime } from "date-fns-tz";

export const BOOKING_TIME_ZONE = "Asia/Colombo";
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function getColomboDayRange(date = new Date()) {
  const localDate = formatInTimeZone(date, BOOKING_TIME_ZONE, "yyyy-MM-dd");
  const startAt = fromZonedTime(`${localDate}T00:00:00`, BOOKING_TIME_ZONE);
  return { startAt, endAt: new Date(startAt.getTime() + DAY_IN_MILLISECONDS) };
}

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
