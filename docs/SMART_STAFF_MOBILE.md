# Smart Staff Mobile — MP-HAWK-14

> "Simple for Staff. Intelligent in the Background. Controlled by Management."

This is a mobile experience for outlet staff (therapist, attendant, receptionist, supervisor). It is open at **`#/m`** (sidebar: *Smart Staff Mobile*). The 12 views MS-01 to MS-12 follow visual boards A, B and C. They are a **UX layer on top of the existing NV screens and engine operations**. There is no new module, no second ledger, and no new approval rule. Every write goes through `HAWK.api.call` (same contracts, audit and mock data as the desktop screens).

Status: **PROTOTYPE / DEMO**. AI = **SIMULATION**. HAWK API **not connected**.

## 1. View map MS → NV → operation

| MS | Name (board) | Route | Existing NV screen | Engine operation | Notes |
|---|---|---|---|---|---|
| MS-01 | Smart Staff Home (A) | `#/m/01` | NV-24 | — (read) | Greeting + outlet/department from the account; quick menu; latest status |
| MS-02 | Smart Item Catalog (A) | `#/m/02` | NV-25 | — | Categories, search, **Stock** (outlet warehouse) separate from **Allowance** (`S.itemBudget().availableQty`); staff do not see prices |
| MS-03 | Product Quick Detail (A) | `#/m/03?it=…` | NV-25 | — | Bottom sheet: category, unit, allowance, availability, quantity, favourite |
| MS-04 | My Request Basket (A) | `#/m/04` | NV-26 | — | Sticky basket; outlet/department/division auto-filled; routine/additional; note |
| MS-05 | Submit & Success (B) | `#/m/05` → `?id=` | NV-26 | `mrf.create` | Shows the approver chain from `S.mrfChain`; "Sent ≠ approved ≠ purchased" |
| MS-06 | My Requests (B) | `#/m/06` | NV-27 | `mrf.cancel` | All / In process / Done tabs; staff-friendly statuses; AI SIMULATION insight |
| MS-07 | Order Journey (B) | `#/m/07?id=` | NV-28 | — | Timeline: submitted → approval → warehouse/procurement → delivery → ready; ETA from PO |
| MS-08 | Pickup & Receiving (B) | `#/m/08?id=` | NV-28 | `mrf.issue`, **`mrf.confirmHandover`** | Internal handover, **not a vendor GRN**; quantity per item, condition, photo, required note when short or damaged |
| MS-09 | Smart Receipt Camera (C) | `#/m/09` | NV-48 / NV-50 | `spend.capture` | Sample receipts (printed / handwritten / blurry) or gallery upload; label "AI SIMULASI — OCR belum terhubung" |
| MS-10 | AI Receipt Review (C) | `#/m/10?id=` | NV-48 | `spend.update`, `spend.submit` | Low-confidence fields marked "periksa"; total vs line math; category/7P/payment; original photo kept |
| MS-11 | Facility & Incident Report (C) | `#/m/11` | NV-55 | `mt.create` (+ area without asset) | Type, photo, area/asset, description, Routine/Urgent/Critical priority |
| MS-12 | My Tasks & Notifications (C) | `#/m/12` | NV-03 | `mrf.decide`, `mt.review`, `mrf.issue` | Per-role feed: staff (ready to receive, decisions, receipts), Supervisor (approve/reject inline, facility reports, hand over), Warehouse (hand over), Purchasing (pending PO → NV-32), others = `HAWK.tasks` |

The registry is in code at `HAWK.MS.SCREENS`. Each view shows a chip `MS-NN · linked to NV-xx`, which opens the related desktop screen.

## 2. Navigation & state map

```
MS-01 Home ──Minta Barang──▶ MS-02 Catalog ──(tap item)──▶ MS-03 sheet
   │                            │ +/− qty (ui.local[100].cart)
   │                            └─Lanjut──▶ MS-04 Basket ──Lanjut──▶ MS-05 Check & Submit
   │                                                         │ mrf.create
   │                                                         ▼
   ├─Permintaan Saya──▶ MS-06 ──(card)──▶ MS-07 Journey ──(ready)──▶ MS-08 Confirm receipt
   ├─Scan Nota──▶ MS-09 ──shutter: spend.capture──▶ MS-10 Review ──spend.submit──▶ (NV-48 history)
   ├─Lapor Fasilitas──▶ MS-11 ──mt.create──▶ MS-11?id= (sent)
   └─🔔 / Tugas tab──▶ MS-12 (approve / hand over / open NV)
Bottom tabs: Beranda 01 · Barang 02 · Permintaan 06 · Tugas 12 (hidden on form/camera views 05, 08, 09, 10, 11)
```

Staff-facing MRF statuses (`HAWK.MS.mrfState`) are derived from existing data; there is no new status column:

| Key | Label | Source |
|---|---|---|
| wait | Menunggu persetujuan | `SUBMITTED` / `ESCALATED` |
| prep | Disiapkan gudang | `IN_FULFILLMENT`, LOCAL/TRANSFER allocation |
| proc | Dalam pengadaan | PURCHASE allocation without a sent PO |
| ship | Dalam pengiriman | transfer `IN_TRANSIT` or PO `SENT/PARTIAL/RECEIVED` |
| ready | Siap diterima | issued qty − confirmed − short > 0 (`S.handoverPending`) |
| done | Selesai | `FULFILLED` |
| stop / rev / draft | Ditolak·Dibatalkan / Perlu diperbaiki / Draft | MRF status |

View state lives in `ui.local[100]` (basket, filter, handover draft, facility form). The tutor lives in `ui.local._msTutor`. Business data stays in `HAWK.store.state`, which is shared with every desktop screen and the Demo Center.

## 3. Design decisions

1. **The basket uses `mrf.create`, not `order.quick` (AR-13).** The brief requires requests to land in the Supervisor's queue (Mila) and to keep the existing MRF approval. Order Sederhana (AR-13 auto-approve ≤ Rp5 jt within budget) is still on NV-24 for outlets that want it. **Owner decision needed** if AR-13 should also apply to the mobile basket.
2. **Handover ≠ GRN.** `mrf.issue` (warehouse/supervisor) remains the only stock movement and CONSUMPTION journal. `mrf.confirmHandover` only records that the requester received the goods (quantity, condition, photo, note) in `mrf.handovers[]` + history `HANDOVER_CONFIRM`. It does not change stock or journals. Vendor GRNs stay in NV-39/40.
3. **Facility report by area.** `mt.create` now accepts `area` without `asset` (e.g. "Ruang Treatment 2"). Outlet accounts can only report for their own outlet. A work order (`wo.requestPart`) falls back to the area when there is no asset.
4. **Auto-filled identity.** Name, outlet, division, department and BU come from `S.assignment(user)` and are never retyped (Owner decision of 8 Nov 2026).
5. **Staff do not see prices or GL.** STAFF role: no unit price, MRF value or account. Supervisor and above see value + budget status on the approval card.
6. **AI = SIMULATION.** The receipt scan uses the existing Smart Spend scenarios (`HAWK.SPEND.SCENARIOS`). AI never approves, pays or posts. "Insight" cards are rule-based summaries of demo data.

## 4. Pandu Saya (guided tutor)

The **🧭 Pandu Saya** button opens the scenario list. Each step shows **Role · Do · Result · Next**. Buttons: **Tunjukkan** (switches to the right demo account, opens the view and highlights the control, then collapses the guide to a pill), **Coba** (collapse it yourself), **Lakukan untuk saya** (only for the Purchasing step, which happens on the desktop NV-32), **Lanjut** (active once the step's check against engine data passes). **↺ Reset data demo** returns everything to the initial state.

| # | Scenario | Accounts | Steps | Engine checks |
|---|---|---|---|---|
| R1 | Request massage oil + towels | Indah | 7 | basket → `mrf.create` SUBMITTED, Ubud, waiting for Supervisor |
| R2 | Track MRF Supervisor → Purchasing | Indah · Mila · Etya | 4 | Mila approves → LOCAL + PURCHASE; Etya `po.createFromMrf/submit/decide/send` → "Dalam pengiriman" + ETA |
| R3 | Receive goods from the warehouse | Supri · Indah | 3 | `mrf.issue` (stock moves) → `mrf.confirmHandover` (stock/journals unchanged) |
| R4 | Scan a handwritten receipt | Indah | 4 | `spend.capture` HANDWRITTEN → fix "Pasir" price 350000 → confirm total + Cash → `spend.submit` (no journal) |
| R5 | Report damaged facility | Dewa · Mila | 5 | DAMAGE + photo + area + HIGH → `mt.create` → Mila `mt.review` APPROVED |

Demo accounts (chip row above the app): Indah (U-STF therapist), Dewa (U-ATD attendant), Mila (U-SPV supervisor), Etya (U-PUR purchasing), Supri (U-WHS warehouse), Asri (U-FIN finance). All use one shared sandbox, so a change by one account appears immediately for the others.

## 5. Component library (`assets/css/hawk.css`, prefix `ms-`)

| Component | Class | Notes |
|---|---|---|
| Phone frame | `.ms-shell`, `.ms-app` (`.dark` for camera) | max 460 px centred; full width ≤ 720 px; 620 px on tablet |
| Header | `.ms-head`, `.ms-logo`, `.ms-ib` (44 px icon button), `.ms-badge` | black→charcoal gradient, sticky |
| Hero & CTA | `.ms-hero-bg`, `.ms-hello`, `.ms-cta` | gold gradient CTA ≥ 84 px tall |
| Quick menu | `.ms-tiles`, `.ms-tile` | 4–5 columns, ≥ 88 px |
| Card | `.ms-card`, `.ms-glass` (selective frosted glass), `.ms-ai` (violet AI) | radius 18 px |
| Chip | `.ms-chip` `ok/warn/bad/gold/info/violet` | status colours |
| Button | `.ms-btn` (`lg` 54 px, `sm` 40 px, `ghost`) | gold gradient, focus ring `#e5c66a` |
| Item row | `.ms-item` (`sel`, `compact`, `warnrow`), `.ms-art` (inline SVG, offline) | |
| Stepper | `.ms-step`, `.ms-sb` (40 px), `.plus` black/gold | |
| Sticky bars | `.ms-basket`, `.ms-tabs` | stay above the bottom tabs; safe-area inset |
| Bottom sheet | `.ms-sheet`, `.ms-sheet-bg`, `.ms-grab` | slide-up animation (off with reduced-motion) |
| Segmented control | `.ms-seg` | |
| Progress | `.ms-prog` | Items → Summary → Confirm |
| Timeline | `.ms-tl` (`done`, `cur`) | |
| Choice | `.ms-choice`, `.ms-kinds`, `.ms-prio` | |
| Photo | `.ms-photos`, `.ms-ph` (`add`) | file input `capture=environment`, downscaled to 640 px JPEG |
| Camera | `.ms-cam`, `.ms-cam-view`, `.ms-cam-c`, `.ms-shutter` | |
| Feed | `.ms-feed` (`new`), `.ms-acts`, `.ms-dot` | |
| Tutor | `.ms-guide`, `.ms-guide-mini`, `.ms-guide-fab`, `.ms-gkv`, `.ms-sc` | uses `HAWK.dxFocus` |

Touch targets are ≥ 44 px (main buttons 48–54 px). The basket, tabs and submit button are sticky. `prefers-reduced-motion` is respected.

## 6. API placeholders (not connected)

| Need | Prototype contract | Status | Notes for the HAWK team |
|---|---|---|---|
| Create MRF from the basket | `mrf.create` | TO VERIFY (existing PR engine) | same payload as NV-26 |
| Handover confirmation | `mrf.confirmHandover` `{id, lines[{item,qty}], condition OK|ISSUE, note, photos[]}` | **NEW INTEGRATION REQUIRED** | not visible in HAWK v2.11.6; must not touch stock/GL |
| Area facility report | `mt.create` `{asset?|area, kind, issue, priority, photos[]}` | TO VERIFY + extension | `area` field + photos are new |
| Push notifications ("Aktifkan Notifikasi") | — | **NEW INTEGRATION REQUIRED** | the prototype only shows a toast |
| Store receipt/receiving/facility photos | — | **NEW INTEGRATION REQUIRED** | see §7 |
| Receipt OCR/AI | `spend.capture` | UI-ONLY SIMULATION | an OCR provider must be called from the **server**; the API key must never be in the browser |

## 7. Evidence storage (photos & receipts)

In the prototype, photos are data URLs inside the **browser** sandbox (`localStorage`). This is **not permanent and not secure**: it is lost when browser data is cleared and is not encrypted. For production:
- upload to the server's object storage (e.g. a private bucket) through an authenticated endpoint; store the **original file unchanged** + SHA-256 hash, with corrections stored separately (as the Smart Spend evidence model already does);
- access through short-lived signed URLs, checked against the role and unit (outlet) on the server;
- retention follows the tax/finance archiving policy (TO VERIFY with Finance & Tax).

## 8. Role notes

| Role | What they see in `#/m` |
|---|---|
| Staff (Indah, Dewa, Yuli) | Home, catalog without prices, basket, own requests, receiving confirmation, receipt scan, facility report, own tasks |
| Supervisor (Mila) | Same + approve/reject requests and facility reports + hand over goods (outlet without warehouse staff); value + budget status visible |
| Warehouse (Supri) | MS-12: "Hand over to …" for ready MRFs; full work stays in NV-38–46 |
| Purchasing (Etya) | MS-12: count of needs waiting for a PO → NV-32 (PO stays on desktop) |
| Finance (Asri) | MS-12: receipt verification tasks etc. from `HAWK.tasks` → NV-48/50 (verification & payment on desktop) |

The view is limited by role in the browser = **DEMO**. The HAWK backend must enforce authorisation itself.

## 9. Tests

- `node tests/workflow.test.js` — T15 (engine): MRF from basket, stock ≠ allowance, LOCAL+PURCHASE, handover validation (before issue, other outlet, excess qty, short/damaged without note), handover does not change stock/ledger/journals/GRNs, area report, other outlet rejected, Purchasing/Finance cannot confirm. **442 passed, 0 failed.**
- `node tests/e2e-smart-staff.js` — real clicks, 390 px (mobile) + 834 px (tablet): R1–R5 via Tunjukkan → action → Lanjut, MS-03 sheet, no prices for staff, MS-12 for 5 roles, 12 views without overflow, reset demo, 0 JS errors. **70 passed, 0 failed.** Screenshots in `docs/screenshots/smart-staff/`.
- Regression: deploy 33/0, walkthrough 21/0, browser-all 1364 visits 0 errors, responsive 3 widths 0 overflow, demo-center 35/0, 7P 30/0, smart-spend 27/0, simple-order 33/0, control-tower 32/0.

## 10. Known gaps

| # | Gap | Status |
|---|---|---|
| S-01 | AR-13 auto-approval is not applied to the mobile basket (§3.1) | Owner decision |
| S-02 | Real push notifications | NOT BUILT (toast only) |
| S-03 | Server-side photo storage | NOT BUILT (browser sandbox, DEMO) |
| S-04 | Real camera: `capture=environment` works on the phone browser, but OCR is still simulated | UI-ONLY SIMULATION |
| S-05 | Favourites are stored per view session only | DEMO |
| S-06 | Physical iPhone/Android/iPad devices | NOT VERIFIED (tested in Chromium emulation 390/834 px) |
| S-07 | Staff "Allowance" = remaining 7P item budget in units (`itemBudget.availableQty`), not a formal per-person quota | TO VERIFY with the Owner |
