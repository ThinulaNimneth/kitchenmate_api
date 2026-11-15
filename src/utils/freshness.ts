import { env } from "../config/env"

export type Freshness = "fresh" | "expiring" | "expired"

const DAY_MS = 24 * 60 * 60 * 1000

//exp date
export const startOfToday = (now = new Date()): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

export const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY_MS)

export const daysUntil = (expirationDate: Date, now = new Date()): number =>
  Math.round((startOfToday(new Date(expirationDate)).getTime() - startOfToday(now).getTime()) / DAY_MS)

export const getFreshness = (expirationDate: Date, now = new Date()): Freshness => {
  const days = daysUntil(expirationDate, now)
  if (days < 0) return "expired"
  if (days <= env.EXPIRING_SOON_DAYS) return "expiring"
  return "fresh"
}

//ui help field
export const withFreshness = <T extends { expirationDate: Date }>(item: T) => ({
  ...item,
  freshness: getFreshness(item.expirationDate),
  daysLeft: daysUntil(item.expirationDate)
})
