import { DateTime } from 'luxon';

export function isToday(timezone: string, target: Date): boolean {
    const localTime = DateTime.local().setZone(timezone);

    return localTime.hasSame(DateTime.fromJSDate(target), 'day');
}
