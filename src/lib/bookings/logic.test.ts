import assert from "node:assert/strict";
import test from "node:test";
import { colomboTimeToUtc } from "./time";
import { findNextAvailableStart, overlaps } from "./logic";

const instant = (hour: number, minute = 0) => new Date(Date.UTC(2026, 0, 1, hour, minute));

test("identifies intersecting booking intervals", () => {
  assert.equal(
    overlaps({ startAt: instant(9), endAt: instant(11) }, { startAt: instant(10), endAt: instant(12) }),
    true,
  );
});

test("allows bookings that meet exactly at the end boundary", () => {
  assert.equal(
    overlaps({ startAt: instant(9), endAt: instant(10) }, { startAt: instant(10), endAt: instant(11) }),
    false,
  );
});

test("does not report separate time windows as overlapping", () => {
  assert.equal(
    overlaps({ startAt: instant(9), endAt: instant(10) }, { startAt: instant(11), endAt: instant(12) }),
    false,
  );
});

test("suggests the first contiguous slot after overlapping bookings", () => {
  const nextStart = findNextAvailableStart(instant(9), 2 * 60 * 60 * 1000, [
    { startAt: instant(10), endAt: instant(11) },
    { startAt: instant(11), endAt: instant(12, 30) },
    { startAt: instant(13), endAt: instant(14) },
  ]);

  assert.equal(nextStart.toISOString(), instant(14).toISOString());
});

test("keeps the requested start when an entire duration fits before a booking", () => {
  const nextStart = findNextAvailableStart(instant(9), 60 * 60 * 1000, [
    { startAt: instant(10), endAt: instant(11) },
  ]);

  assert.equal(nextStart.toISOString(), instant(9).toISOString());
});

test("converts Colombo wall time to a UTC instant", () => {
  assert.equal(colomboTimeToUtc("2026-01-01T09:00").toISOString(), "2026-01-01T03:30:00.000Z");
});
