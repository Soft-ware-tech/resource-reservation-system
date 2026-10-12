export type TimeInterval = {
  startAt: Date;
  endAt: Date;
};

export function overlaps(first: TimeInterval, second: TimeInterval) {
  return first.startAt < second.endAt && first.endAt > second.startAt;
}

export function findNextAvailableStart(
  requestedStart: Date,
  durationMilliseconds: number,
  existing: readonly TimeInterval[],
) {
  let candidate = new Date(requestedStart);
  const ordered = [...existing].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  for (const interval of ordered) {
    const candidateEnd = candidate.getTime() + durationMilliseconds;
    if (candidateEnd <= interval.startAt.getTime()) continue;
    if (candidate.getTime() < interval.endAt.getTime()) {
      candidate = new Date(interval.endAt);
    }
  }

  return candidate;
}
