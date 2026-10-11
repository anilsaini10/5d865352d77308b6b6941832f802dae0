# NOUGHT ONE — School Management Web Panel

React 19 + Vite 6 + Tailwind CSS 3 + React Router 7. Ek hi panel do roles ke liye:

- **Super Admin** — schools create/edit, school admins manage.
- **School Admin (ADMIN)** — classes/sections/subjects, students, teachers, staff,
  timetable, exams + marks, attendance report, teacher attendance, leave approvals,
  announcements, events, notifications.

Login screen par role choose hota hai; login ke baad usi role ka sidebar aur
routes mount hote hain (`src/App.jsx` → `src/routes/*Routes.jsx`).

## Setup

```bash
npm install
npm run dev        # local backend   (.env.development → http://localhost:5000/api)
npm run dev:live   # Render backend  (.env.production)
npm run build      # production build → Render backend
npm run build:local  # build jo local backend se baat kare
```

Backend URL sirf `.env.development` / `.env.production` mein hai. Apne liye
alag URL chahiye to `.env.development.local` banayein (git mein nahi jata).

## Theme (colors, fonts, text sizes, radius)

Saari styling **ek file** se aati hai: [`src/theme/theme.js`](src/theme/theme.js).

- `colors` — hex values; har token ke saath comment hai ki wo kahan use hota hai
  (background, primary, accent, danger, success …). Mobile app ka palette aane par
  sirf yahi values badalni hain.
- `fonts`, `fontSizes` (Tailwind `text-xs … text-4xl` override), `radius`
  (`rounded-sm … rounded-2xl` override).

`applyTheme()` (`src/theme/applyTheme.js`) inhe CSS variables bana kar `:root`
par likhta hai, aur `tailwind.config.js` sab classes ko un variables se jodta hai —
isliye components mein kabhi hex color ya `bg-white` na likhein; theme tokens
(`bg-surface`, `text-ink/60`, `bg-board`, `text-coral` …) hi use karein.
Runtime par naya theme lagana ho to `applyTheme(newTheme)` call karein.

## Structure

```
src/
  api/            httpClient (auth header + refresh), apiHelpers
  theme/          theme.js (tokens), applyTheme.js
  components/     AppShell, Sidebar, navigation.js (role-wise nav), ui.jsx (shared UI)
  hooks/          useFetch, useDebouncedValue
  utils/          format helpers
  routes/         ProtectedRoute, SuperAdminRoutes, AdminRoutes
  features/
    auth/         login (role picker), forgot/change password, roles.js
    schools/ admins/ dashboard/   super admin
    admin/<module>/               school admin — har module mein *.api.js + pages
```

Naya page: feature folder mein page banayein, role ke routes file mein route
add karein, aur `src/components/navigation.js` mein nav entry.
