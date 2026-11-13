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

## Twist: Gentle overdue mode
- Overdue items are flagged **privately** (owner and borrower only), never in public lists or cards.
- Reminders are generated in 3 tones and contain **no phone numbers or contact details**; inputs containing phone/email patterns are rejected.
- Lending cycle: Available → Borrowed → Returned (then Available again).
- "Load sample essentials" adds calculators, extension boards, lab coats and more. Use the top-right "view as" name to see the owner/borrower views.
- The footer "Demo date" buttons skip ahead in time so any item can become overdue.
