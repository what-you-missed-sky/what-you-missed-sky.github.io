export function epochUsToDateTime(cursor: number): string {
    return new Date(cursor / 1000).toISOString();
}

export function hoursAgo(hours: number) {
    return new Date(Date.now() - (hours * 60 * 60 * 1000));
}

export function toMicroseconds(date: Date) {
    return date.getTime() * 1000;
}
