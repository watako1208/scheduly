export function generateSlots(dateStr: string, startTime: string, endTime: string): string[] {
  const slots: string[] = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let h = sh, m = sm
  while (h * 60 + m < eh * 60 + em) {
    slots.push(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += 30
    if (m >= 60) { h++; m = 0 }
  }
  return slots
}

export function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function formatRange(start: string, end: string): { date: string; start: string; end: string } {
  const [d, st] = start.split('T')
  const [, et] = end.split('T')
  const endMin = toMin(et) + 30
  const endH = Math.floor(endMin / 60)
  const endM = endMin % 60
  const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  return { date: d, start: st, end: endStr }
}

export function mergeSlots(slots: string[]): { date: string; start: string; end: string }[] {
  if (!slots.length) return []
  const sorted = [...slots].sort()
  const result: { date: string; start: string; end: string }[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (let i = 1; i < sorted.length; i++) {
    const [pd, pt] = prev.split('T')
    const [cd, ct] = sorted[i].split('T')
    if (pd === cd && toMin(ct) === toMin(pt) + 30) {
      prev = sorted[i]
    } else {
      result.push(formatRange(start, prev))
      start = sorted[i]
      prev = sorted[i]
    }
  }
  result.push(formatRange(start, prev))
  return result
}

export function fmtDate(d: string): string {
  const [, mo, day] = d.split('-')
  const dow = ['日', '月', '火', '水', '木', '金', '土'][new Date(d + 'T00:00:00').getDay()]
  return `${parseInt(mo)}/${parseInt(day)}(${dow})`
}

export const COLORS = [
  '#4f86c6', '#e07b54', '#6abf85', '#c47fc4',
  '#d4aa3b', '#5bbfbf', '#e07b9a', '#8a8abf',
  '#9b7b52', '#7b9b52',
]
