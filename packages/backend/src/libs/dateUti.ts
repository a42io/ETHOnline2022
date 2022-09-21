import { DateTime, Interval } from 'luxon';

export function isToday(timezone: string, target: Date): boolean {
    const localTime = DateTime.local().setZone(timezone);

    return localTime.hasSame(DateTime.fromJSDate(target), 'day');
}

export function isBetween(target: DateTime, a: Date, b: Date): boolean {
    return Interval.fromDateTimes(a, b).contains(target);
}
