# BorrowBox
Peer-to-peer lending app for a college hostel. Built for VibeSprint – OWASP NIE 2026.

## Run (Node.js 18+)
```bash
npm install
npm run dev
```
Open the URL shown in the terminal (usually http://localhost:5173).

## Build
```bash
npm run build
npm run preview
```

## How to use
The app starts empty: everything is entered by the user.
1. **Lend an item**: add a name, category, your name and room.
2. **Browse** and open an item, then **Request item** with your details and a due date (pick a past date to see an overdue item).
3. In **Loans** or the item page: view holder and due date, **Generate polite reminder**, and **Mark as returned**.

Frontend only: no backend, login or API keys. Data is saved in the browser's localStorage; "Clear all data" resets it.

## Landing-page experience
- Cursor-following ambient lighting, subtle card tilt and magnetic call-to-action buttons on desktop pointers.
- Interactive lending-cycle explorer, clickable category photography, animated live counts and step-by-step process cards.
- Flip-to-read privacy promises, tone-switchable reminder preview with copy action, and expandable FAQs.
- Responsive layouts and reduced-motion support.
- Item categories use real editorial photographs served from the Unsplash image CDN; an internet connection is needed for the photographs. Interface pictograms use consistent inline SVGs rather than emoji glyphs.

## Twist: Gentle overdue mode
- Overdue items are flagged **privately** (owner and borrower only), never in public lists or cards.
- Reminders are generated in 3 tones and contain **no phone numbers or contact details**; inputs containing phone/email patterns are rejected.
- Lending cycle: Available → Borrowed → Returned (then Available again).
- "Load sample essentials" adds calculators, extension boards, lab coats and more. Use the top-right "view as" name to see the owner/borrower views.
- The footer "Demo date" buttons skip ahead in time so any item can become overdue.

## Prototype limitations
The "view as" name selector is a demo convenience, not authentication. The app is browser-only and data does not sync between devices or browsers.
