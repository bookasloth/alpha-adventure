// Alpha Adventures operates in IST (Asia/Kolkata, UTC+5:30, no DST). "Today" for
// departure cutoffs and dashboards must be the IST calendar day, not UTC's —
// they differ for the 5.5h around UTC midnight, which would hide or show a
// departure on the wrong side of midnight (audit §3.1).
export function istToday(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}
