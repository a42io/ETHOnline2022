import { DateTime, Interval } from 'luxon';
import { DateTimeUnit } from 'luxon/src/datetime';
import timezones from 'timezones-list';

export function isToday(timezone: string, target: Date): boolean {
    const localTime = DateTime.local().setZone(timezone);
    return localTime.hasSame(DateTime.fromJSDate(target), 'day');
}

export function isBetween(target: DateTime, a: Date, b: Date): boolean {
    return Interval.fromDateTimes(a, b).contains(target);
}

export function isFuture(
    a: Date,
    b: Date = new Date(),
    unit: DateTimeUnit = 'minute'
): boolean {
    return (
        DateTime.fromJSDate(a).startOf(unit) >=
        DateTime.fromJSDate(b).startOf(unit)
    );
}

export function isValidTimeZone(zone?: string): boolean {
    if (!zone) return false;
    return timezones.some((r) => r.tzCode === zone);
}
