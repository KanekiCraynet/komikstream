# UI/UX Spec — Toraka Reference
Version: 1.0 | Date: 2026-07-05
Source: https://toraka.com/ (CSS scraped live)

---

## 1. Brand & Identity

| Item | Value |
|------|-------|
| Style | Dark navy / deep space manga platform |
| Audience | Manga/manhwa reader, Asia-Pacific |
| Tone | Sleek, immersive, content-first |
| Logo font | Boogaloo (cursive display) |
| Body font | Inter, -apple-system, BlinkMacSystemFont, "SF Pro", system-ui, sans-serif |

---

## 2. Color Palette

Diekstrak dari CSS bundle toraka.com (assets/index-D6VEm2a0.css):

### Background Hierarchy
```
bg-base      #0A0F1C  — halaman utama, body
bg-surface   #141B2F  — card, panel
bg-elevated  #1A2436  — modal, dropdown, header
bg-subtle    #1E293B  — hover state, divider
bg-overlay   #283041  — tooltip, overlay
```

### Primary Brand
```
brand-blue        #0064FF  — CTA button, link aktif, highlight utama
brand-blue-alt    #1665F4  — hover state primary
brand-cyan        #00BBFF  — accent highlight, badge
```

### Semantic
```
success    #23AB55  — status baca, badge lengkap
danger     #FF5640  — alert, error state
danger-alt #d53030  — hover danger
warning    #FF6B6B  — soft warning / label mature
```

### Text
```
text-primary    #DDE1F0  — body text utama
text-secondary  #878F9C  — label, meta, subtext
text-muted      #64748B  — placeholder, disabled
text-on-dark    #FFFFFF  — teks di atas button/banner
```

### Opacity Tokens
```
overlay-dark   #0000001a  — scrim di atas cover image
overlay-card   transparent → pakai bg-surface
```

---

## 3. Typography

### Scale
```
display   32–40px / font-bold  / Boogaloo → judul hero, site logo
h1        24–28px / font-bold  / Inter    → nama manga/series
h2        18–20px / font-semibold / Inter → section heading (Trending, New)
h3        14–16px / font-medium / Inter   → card title
body      14px    / font-normal / Inter   → deskripsi, konten
small     12px    / font-normal / Inter   → meta: chapter, tanggal, rating
label     11px    / font-medium / Inter   → badge, status chip
```

### Aturan
- Line height body: 1.6
- Line clamp card title: 2 baris
- Letter spacing heading: -0.01em

---

## 4. Spacing & Layout

### Grid
```
Container max-width: 1280px, px-4 (mobile) / px-6 (tablet) / px-8 (desktop)
Grid manga: 2 col (mobile) → 4 col (tablet 768px) → 6 col (desktop 1024px)
Gutter card: 12px
```

### Card Sizes (dari Splide config)
```
featured-card   : 190px wide (carousel)
top-series-card : 348px (mobile) / 408px (desktop ≥1024px)
trending-card   : auto width, height stretch
```

### Spacing Token
```
xs  4px
sm  8px
md  12px
lg  16px
xl  24px
2xl 32px
3xl 48px
```

---

## 5. Component Specs

### 5.1 Navbar
```
height         : 64px (sticky, top-0, z-50)
bg             : #0A0F1C/80 + backdrop-blur-xl
border-bottom  : 1px solid #1E293B
logo           : Boogaloo font, brand-blue + white split
nav links      : text-secondary → hover text-white + bg-elevated
search icon    : kanan navbar, ghost button
mobile         : hamburger → sidebar drawer full-height
```

### 5.2 Hero / Featured Carousel
```
height         : 480px (mobile 300px)
bg             : cover image + gradient overlay bottom-to-top
overlay        : linear-gradient(to top, #0A0F1C 0%, #0A0F1C80 50%, transparent)
title          : 28–36px bold white
genre pills    : rounded-full, bg-brand-blue/20 text-brand-cyan text-xs
chapter badge  : bg-brand-blue text-white, top-right corner
splide nav     : bullet dots bottom-center
```

### 5.3 Manga Card (Standard)
```
aspect-ratio   : 3/4 (portrait cover)
border-radius  : 8px
bg-card        : #141B2F
shadow         : 0 4px 12px #0000001a
hover          : scale(1.03) + shadow-lg + 200ms ease
cover          : object-fit cover, absolute inset-0
title          : text-primary, 13px semibold, line-clamp-2, bottom overlay
chapter badge  : bottom-left, bg-black/60 text-white 11px
new badge      : top-right bg-success (#23AB55) text-white 10px bold
hot badge      : top-right bg-danger (#FF5640) text-white 10px bold
```

### 5.4 Chapter Reader
```
bg             : #0D1426 (paling gelap)
image          : max-width 800px, centered, fit-width
nav            : fixed bottom bar, bg-elevated blur
prev/next      : large tap target (48px min)
reading mode   : LTR strip / RTL / Webtoon (vertical scroll)
progress bar   : thin brand-blue bar top
```

### 5.5 Section Row (Trending / Highest Rated / Most Popular)
```
layout         : horizontal scroll, overflow-visible
item           : Splide slide, h-auto, opacity:1, no transform
padding        : 0, scrollbar hidden
heading        : h2 text-primary, border-left 3px solid brand-blue, pl-3
cta            : "Lihat Semua" → ghost link kanan heading
```

### 5.6 Badge / Chip
```
genre-pill     : rounded-full px-3 py-1 text-xs bg-blue/10 text-cyan border border-blue/20
rating-badge   : ⭐ yellow + number, bg-black/40 rounded px-2
status-chip    : "Ongoing" green / "Completed" blue / "Hiatus" orange
```

### 5.7 Search Bar
```
bg             : #1A2436
border         : 1px solid #334155
border-focus   : brand-blue ring 2px
placeholder    : text-muted
border-radius  : 10px
icon           : Search lucide kiri, text-secondary
height         : 44px
```

### 5.8 Footer
```
bg             : #0A0F1C
border-top     : 1px solid #1E293B
links          : text-muted → hover text-primary
logo           : repeat navbar logo
grid           : 4 col desktop, 2 col tablet, 1 col mobile
copyright      : text-muted text-sm center
```

---

## 6. Motion & Interaction

```
transition-base : all 200ms ease
hover-scale     : scale(1.03) — card cover
hover-color     : 150ms ease — link/button
sidebar-slide   : translateX(-100%) → 0, 300ms ease
image-fade      : opacity 0 → 1, 400ms — chapter image load
skeleton-pulse  : shimmer 1.5s infinite linear
```

---

## 7. Responsive Breakpoints

```
sm   640px  — 2-col grid
md   768px  — 4-col, show desktop nav
lg  1024px  — 6-col, wide cards
xl  1280px  — container max
```

---

## 8. Dark Mode (Default)

Platform ini **full dark by default** (tidak ada light mode toggle untuk reader).
Toraka hanya dark — semua bg/color di atas adalah dark mode aktif.

---

## 9. Mapping ke KuroManga Stack

| Toraka Pattern | KuroManga Implementation |
|---------------|--------------------------|
| bg-base #0A0F1C | CSS var `--background: 222 47% 6%` (sudah ada di globals.css) |
| brand-blue #0064FF | `--primary: 217 91% 60%` — perlu geser lebih saturasi |
| Splide carousel | Bisa pakai CSS scroll-snap native atau Splide (add dep) |
| Card hover scale | `hover:scale-[1.03] transition-transform duration-200` |
| Boogaloo logo font | Tambah `next/font/google` Boogaloo untuk branding |
| Chapter reader bg | Tambahkan `--reader-bg: #0D1426` CSS var |
| Overlay gradient | `.hero-gradient` sudah ada di globals.css — match |

---

## 10. Assets Checklist

- [ ] Logo font: Boogaloo dari Google Fonts
- [ ] Icon set: Lucide (sudah ada di project)
- [ ] Cover placeholder: 3:4 ratio, bg #141B2F
- [ ] Favicon: bg brand-blue, white icon
- [ ] OG image: 1200x630, dark navy bg + logo center
