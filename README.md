# 🎓 Global Scholarships 2027

A professional scholarship discovery platform with **1,065 verified opportunities** from **60 countries** covering Bachelor, Master, and PhD programs worldwide.

## ✨ Features

- 🔍 **Live search** — find scholarships by name, university, or keyword
- 🎓 **Degree filters** — Bachelor / Master / PhD
- 🌍 **Country dropdown** — 60 countries with counts
- 📚 **Subject dropdown** — 104 subjects with counts
- 💰 **Funding filter** — Fully Funded / Partial
- ↕️ **Sorting** — Latest, Deadline, A–Z, Fully Funded first
- 📱 **Fully responsive** — 3-column grid on mobile, desktop layout on wide screens
- 📋 **Detail modal** — full scholarship info with official Apply links
- ⚡ **Latest Scholarships** — quick sort from the mobile menu
- 🏷️ **Active filter chips** — see and remove applied filters
- ⬆️ **Back to top** button

## 📊 Dataset

| Metric | Count |
|--------|-------|
| Total scholarships | 1,065 |
| Fully funded | 449 |
| Countries | 60 |
| Subjects | 104 |
| For Pakistani students | 10 |

**Degree levels:** Bachelor (27) · Master (572) · PhD (466)

Data is compiled from official university scholarship portals and reputable aggregators. Always verify eligibility on the official site.

## 🚀 Deploy

### Vercel (recommended)

```bash
vercel deploy --prod
```

Or connect the GitHub repo in the Vercel dashboard — zero config needed.

### Any static host

The site is 100% static. Just serve the folder:

```bash
npx serve .
```

Or open `index.html` directly — it works without a server (`data.js` embeds the dataset).

## 📁 Structure

```
├── index.html          # Main page
├── style.css           # Design system (navy #0a1f44 + cyan #00d4aa)
├── script.js           # Search, filters, sorting, modal
├── data.js             # 1,065 records (window.SCHOLARSHIPS)
├── scholarships.json   # Same data as JSON backup
├── sitemap.xml         # SEO
└── robots.txt          # SEO
```

## 🛠️ Tech

- Vanilla HTML / CSS / JavaScript — no frameworks, no build step
- Google Fonts (Poppins) + Font Awesome
- CSS custom properties, `clamp()` fluid type, 5 responsive breakpoints

## 📄 License

MIT — verify all scholarship details on official sources before applying.
