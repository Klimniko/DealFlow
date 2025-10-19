import { add, type Duration } from 'date-fns';

const durationRegex = /^(\d+)([smhdw])$/;

export function parseDuration(duration: string): Duration {
  const match = durationRegex.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return { seconds: value };
    case 'm':
      return { minutes: value };
    case 'h':
      return { hours: value };
    case 'd':
      return { days: value };
    case 'w':
      return { weeks: value };
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}

export function durationToMilliseconds(duration: Duration) {
  const base = new Date(0);
  const target = add(base, duration);
  return target.getTime();
}
