# Vidyalaya Admin — School Super Admin Console (Template)

React 19 + Vite 6 + Tailwind CSS 3 + React Router 7 mein bana hua ek super
admin template. Ismein school create/edit/delete, admin create/edit/delete
aur admin ko school assign karne jaisa basic CRUD flow hai.

## Setup

```bash
npm install
npm run dev
```

Browser mein `http://localhost:5173` khulega.

Production build:

```bash
npm run build
npm run preview
```

## Demo login

- Email: `superadmin@vidyalaya.app`
- Password: `admin123`

(Login page par "Demo credentials bhare" button se auto-fill ho jayega.)

## Kya-kya hai isme

- **Dashboard** — schools, students, admins ka summary + recent activity.
- **Schools** — search/filter, create, edit, delete. Fields: naam, code,
  board, city/state, principal, contact, student count, status.
- **Admins** — search/filter by role, create, edit, delete. Har School
  Admin ek school se assign hota hai; Super Admin sab schools access
  kar sakta hai.
- Responsive layout (mobile sidebar drawer), toasts, confirm-before-delete
  dialogs, empty states.

## Data

Abhi ke liye data `localStorage` mein store hota hai (mock backend) taaki
template turant chal jaye bina kisi API ke. Real backend jodne ke liye:

1. `src/context/DataContext.jsx` mein `addSchool`, `updateSchool`,
   `deleteSchool`, `addAdmin`, `updateAdmin`, `deleteAdmin`, `assignAdmin`
   functions ko apne API calls (fetch/axios) se replace karein.
2. `src/context/AuthContext.jsx` mein `login` function ko real auth
   endpoint (JWT/session) se connect karein.
3. Schema `src/data/seed.js` mein dekh sakte hain — apni API response
   isi shape mein map kar dein.

## Structure

```
src/
  components/    # Sidebar, AppShell (topbar+layout), shared UI (Modal, Badge, etc.)
  context/       # AuthContext, DataContext, ToastContext
  data/          # seed/mock data
  pages/         # Login, Dashboard, Schools, Admins
```

## Customize

- Colors/fonts: `tailwind.config.js` (theme.extend) aur `index.html`
  (Google Fonts link).
- Naya page add karna ho to `src/pages/` mein file banayein, `App.jsx`
  mein route add karein, aur `src/components/Sidebar.jsx` ke `NAV` array
  mein entry add karein.
