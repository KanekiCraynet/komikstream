# UI/UX Spec — AsuraScans Reference
Version: 1.1 | Date: 2026-07-31
Source: https://asurascans.com/ (HTML + CSS bundle live, 2026-07-30)

---

## 1. Brand & Identity

| Item | Value |
|------|-------|
| Style | Dark fantasy / purple scanlation portal |
| Audience | Manhwa/action/fantasy reader |
| Tone | Premium, energetic, chapter-update heavy |
| Body font | system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif |
| Visual anchor | Purple glow, dark card surfaces, dense latest updates |

---

## 2. Color Palette

Diekstrak dari CSS bundle asurascans.com (`_astro/_slug_.c-Wr2WE2.css`):

### Background Hierarchy
```
bg-base       #13111A  — body, page background
bg-surface    #1A1721  — card surface
bg-elevated   #1C1924  — navbar, panels
bg-hover      #1F1A2E  — hover/active surface
bg-purple     #2A1F3D  — tinted featured sections
bg-border     #312F40  — border/divider
bg-soft       #3D3655  — input border, chip surface
```

### Primary Brand
```
brand-purple      #913FE2  — CTA, active nav, primary accent
brand-purple-alt  #7C35C2  — hover/pressed CTA
brand-purple-soft #A78BFA  — text accent, secondary link
brand-purple-hot  #A855F7  — glow/highlight
```

### Semantic
```
warning-gold   #FBBF24  — rating star, premium/highlight badge
discord-blue   #5865F2  — community button / social CTA
white          #FFFFFF  — high contrast text
```

### Transparent Tokens
```
purple-10   #913fe21a
purple-15   #913fe226
purple-20   #913fe233
purple-30   #913fe24d
white-05    #ffffff0d
white-10    #ffffff1a
white-20    #ffffff33
white-30    #ffffff4d
black-soft  #0000001a
```

---

## 3. Typography

### Scale
```
display   30–42px / font-extrabold / system-ui → hero title
h1        24–32px / font-bold      / system-ui → series title
h2        18–22px / font-bold      / system-ui → Latest Updates, Popular
h3        15–17px / font-semibold  / system-ui → card/list title
body      14–16px / font-normal    / system-ui → description
small     12–13px / font-medium    / system-ui → chapter, date, meta
badge     10–12px / font-bold      / uppercase → status/rank
```

### Aturan
- Use system font only. No extra font dependency.
- Section title bold + purple accent underline.
- Card title max 2 lines.

---

## 4. Spacing & Layout

### Page Shell
```
body bg          : #13111A
container        : max-width 1200–1280px
mobile padding   : 16px
desktop padding  : 24px
section gap      : 32px
```

### Homepage Pattern
```
1. Sticky dark navbar
2. Hero / promoted series carousel
3. Latest updates dense list
4. Popular / weekly ranking sidebar
5. Genre/category shortcuts
6. Footer + Discord/community CTA
```

### Grid
```
Manga card grid : 2 col mobile → 3 col tablet → 5/6 col desktop
Latest updates  : 1 col mobile → 2 col desktop list
Sidebar         : hidden mobile → right column desktop
```

---

## 5. Component Specs

### 5.1 Navbar
```
height         : 56px local / sticky top-0 z-50
bg             : brand purple local; Asura source uses dark elevated surface
logo           : icon + KomikStream wordmark
primary nav    : Home, Browse, Genre dropdown
search         : overlay trigger; input + search icon; Ctrl/Cmd+K; click trigger tidak langsung redirect
bookmark       : icon kanan dekat search
account        : avatar/user icon kanan
mobile         : hamburger → Home, Browse, daftar genre dinamis
```

Genre berasal dari DB dan diurutkan alfabetis. `Manhwa`, `Manga`, dan `Manhua` adalah **type komik**, bukan genre, sehingga wajib dikeluarkan dari dropdown, menu mobile, sidebar, dan filter katalog.

### 5.2 Hero / Featured Series
```
bg             : #1A1721 card + purple radial glow
border         : 1px solid #913fe226
radius         : 16px
cover          : 3:4 ratio, rounded-xl
content        : title, excerpt, genre chips, latest chapter CTA
primary CTA    : bg #913FE2 → hover #7C35C2
secondary CTA  : border #3D3655 bg #ffffff0d
rating         : #FBBF24 star + white value
```

### 5.3 Manga Card
```
bg             : #1A1721
border         : 1px solid #ffffff0d
radius         : 12px
cover ratio    : 3/4
hover          : translateY(-4px) + border #913FE2 + shadow purple glow
shadow hover   : 0 12px 30px #913fe226
title          : white, 14px semibold, clamp-2
meta           : #A78BFA / #ffffff99, 12px
status badge   : top-left, bg #913FE2 text-white
chapter badge  : bottom overlay, bg-black/60
```

### 5.4 Latest Updates List
```
row bg         : #1A1721
row border     : 1px solid #ffffff0d
row hover      : #1F1A2E
cover thumb    : 56x76px rounded-lg
series title   : white semibold
chapter links  : stacked pills, bg #ffffff0d hover bg #913fe21a
release time   : muted text right / below mobile
layout mobile  : full-width stacked
layout desktop : 2-column dense grid
page size      : 20
pagination     : ‹ + maksimal 5 nomor + ›
active page    : bg #913FE2 text-white
```

Tidak ada tombol `All Comics` di Latest Updates. Tombol itu hanya milik Trending pada referensi live.

### 5.5 Ranking / Popular Sidebar
```
bg             : #1C1924
border         : 1px solid #312F40
radius         : 16px
rank number    : #913FE2, 20px bold
rank top-3     : #FBBF24 for #1, purple glow for active
thumb          : 48x64px rounded
text           : title clamp-1, chapter/rating small muted
item count     : 10
```

Di bawah list ranking tampil section **Genres**: grid dua kolom dari genre DB, hover `bg-[#913FE2]`, tautan ke `/manga?genre=slug`.

### 5.6 Search / Filter
```
input bg       : #1C1924
border         : #312F40
focus          : border #913FE2 + ring #913fe233
height         : 44px
radius         : 10px
placeholder    : #ffffff66
genre chip     : bg #ffffff0d, active bg #913FE2
sort dropdown  : bg #1C1924 border #312F40
```

### 5.7 Chapter Reader
```
bg             : #13111A
reader width   : max 900px
image gap      : 0–8px (webtoon continuous)
top bar        : sticky, bg #13111A/90 + blur
bottom nav     : prev / chapter select / next
reader controls: purple active state
comment area   : card bg #1A1721 border #312F40
```

### 5.8 Discord / Community CTA
```
bg             : #5865F2
text           : white
radius         : 12px
icon           : left, white
placement      : sidebar / footer
copy           : short, action-first
```

---

## 6. Motion & Interaction

```
transition-base : 150–200ms ease
card-hover      : translateY(-4px), border-purple, glow
button-hover    : bg #7C35C2
link-hover      : text #A78BFA
skeleton        : bg #ffffff0d → #ffffff1a pulse
modal           : scale 0.98 → 1 + opacity 0 → 1
```

Motion harus ringan. Tidak perlu parallax / heavy animation.

---

## 7. Responsive Breakpoints

```
sm   640px  — 2 card grid
md   768px  — 3 card grid, desktop nav starts
lg  1024px  — content + sidebar split
xl  1280px  — max container
```

---

## 8. Accessibility Rules

- Contrast min 4.5:1 untuk text normal.
- Purple CTA harus pakai text white, bukan gray.
- Semua card clickable tetap punya visible focus ring.
- Manga cover wajib `alt="{title} cover"`.
- Chapter reader navigable via keyboard: ArrowLeft / ArrowRight.
- Tap target minimal 44x44px.

---

## 9. Mapping ke KuroManga Stack

| AsuraScans Pattern | KuroManga Implementation |
|-------------------|--------------------------|
| Purple dark theme | Tambah theme variant via CSS vars, jangan hardcode di component |
| Dense latest updates | Reuse existing list/card components; tambah compact mode bila perlu |
| Ranking sidebar | Native grid column; no carousel needed |
| Hover glow card | Tailwind class: `hover:border-primary hover:shadow-[0_12px_30px_hsl(var(--primary)/0.18)]` |
| System font | Current Geist ok, but Asura reference closer ke system-ui |
| Astro/Tailwind v4 style | Project sudah Tailwind v4 — match token style |

---

## 10. KuroManga Recommended Merge

Gunakan hybrid:

- Base: Toraka dark navy (#0A0F1C) untuk reader comfort.
- Accent: AsuraScans purple (#913FE2) hanya untuk campaign/event/community variant.
- Default KuroManga brand tetap blue (`--primary`) karena codebase sudah blue.
- Latest updates ambil AsuraScans dense list pattern.
- Hero + reader ambil Toraka immersive pattern.

### Token Diff Minimal
```
--background: 222 47% 6%;   /* Toraka base */
--card:       224 35% 12%;  /* between Toraka #141B2F and Asura #1A1721 */
--primary:    217 100% 50%; /* Toraka #0064FF */
--accent:     267 73% 57%;  /* Asura #913FE2 optional */
--reader-bg:  #0D1426;
```

---

## 11. Assets Checklist

- [ ] OG image dark navy + blue/purple gradient.
- [ ] Default cover placeholder 3:4.
- [ ] Discord/community CTA asset optional.
- [ ] Rating star icon can use plain Unicode or lucide star.
- [ ] No new carousel dependency unless CSS scroll-snap fails UX.
