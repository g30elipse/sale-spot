// The five accent themes: OKLCH ramps regenerated over the Organic tokens.
export interface ThemeDef {
  label: string
  h: number
  h2: number
  c?: number
}

export const THEMES: ThemeDef[] = [
  { label: 'Terracotta', h: 45, h2: 118 },
  { label: 'Espresso', h: 28, h2: 95, c: 0.7 },
  { label: 'Sage', h: 132, h2: 48 },
  { label: 'Plum', h: 352, h2: 145 },
  { label: 'Ocean', h: 232, h2: 150 }
]

const RAMP_L = [97, 92, 85, 75, 66, 56, 45, 35, 25]
const RAMP_C = [0.02, 0.05, 0.09, 0.13, 0.14, 0.14, 0.13, 0.11, 0.08]

export const ramp = (h: number, mul = 1): string[] =>
  RAMP_L.map((L, i) => `oklch(${L}% ${(RAMP_C[i] * mul).toFixed(3)} ${h})`)

export function applyTheme(theme: string): void {
  const el = document.documentElement
  const names = (i: number) => [`--color-accent-${(i + 1) * 100}`, `--color-accent-2-${(i + 1) * 100}`]
  if (theme === 'Terracotta') {
    RAMP_L.forEach((_, i) => names(i).forEach(n => el.style.removeProperty(n)))
    el.style.removeProperty('--color-accent')
    el.style.removeProperty('--color-accent-2')
    return
  }
  const t = THEMES.find(x => x.label === theme) || THEMES[0]
  const a = ramp(t.h, t.c), b = ramp(t.h2, (t.c || 1) * 0.75)
  a.forEach((v, i) => el.style.setProperty(`--color-accent-${(i + 1) * 100}`, v))
  b.forEach((v, i) => el.style.setProperty(`--color-accent-2-${(i + 1) * 100}`, v))
  el.style.setProperty('--color-accent', a[4])
  el.style.setProperty('--color-accent-2', b[4])
}
