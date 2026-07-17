import { siteConfig } from '../site.config';

const longDateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  dateStyle: 'long',
  timeZone: siteConfig.timezone,
});

const shortDateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  month: '2-digit',
  day: '2-digit',
  timeZone: siteConfig.timezone,
});

export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDateFormatter.format(date);
}
