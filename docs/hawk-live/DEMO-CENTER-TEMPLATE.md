# Template Demo Experience Center · hawk-live (`dx-lab.js`)

DATA DEMO / SIMULASI. Model: Demo Center Finance (`assets/js/screens/x-demo.js`). Satu portal punya satu lab, fokus pada timnya sendiri. Langkah divisi lain hanya muncul bila memang bagian alur, dan berjalan otomatis sebagai konteks.

## Isi lab
- **Option 1 · Scenario Test Lab.** Satu frame aplikasi asli (`<halaman>?embed=1&role=…&persona=…#rute`). Ada tombol login role untuk tim portal itu dan pilihan Desktop (1280), iPad (834) atau Mobile (390).
- **Smart Tutor.** Pilih skenario, Mulai ulang (data demo kembali ke awal), progres, kartu langkah (peran, layar, status), Jalankan / Buka layar, Sebelumnya/Berikutnya, dan daftar langkah.
- **Option 2 · Simulator.** Beberapa frame anggota tim, masing-masing di perangkatnya sendiri, berbagi satu sandbox (`localStorage` `hawk-integrated-demo-v1`).
- **Tab tambahan (opsional).** Misalnya persona dan kinerja tim.

Frame berada di luar `#view`, sehingga render ulang halaman (termasuk event `storage` dari frame lain) tidak memuat ulang frame. Dalam mode embed, prefs demo tidak ditulis ke `localStorage`, dan chip role menampilkan nama persona.

## Cara memakai
Muat `dx-lab.js` setelah `app.js` dan sebelum file lab portal, lalu panggil:

```js
HL.DXLAB.define({
  portal: 'HRD', route: 'hrd-dx', publicRole: 'hrd',
  title, eyebrow, intro, purpose,
  personas: [{ id, name?, emp?, role, title, home, does }],
  team: ['made', 'harja', 'ayu', 'hg'],          // hanya mereka yang punya tombol login
  scenarios: [{ id, name, why, steps: [{ who, title, what?, route: (ctx) => 'rute', run: (U, ctx, state) => 'hasil' }] }],
  sim: [{ who: 'made', device: 'desktop' }, …],
  update: (state, action, input) => HR.update(state, action, input), stateOf: (s) => …,
  nameOf: (p) => …, extra: { label, html: () => '…' }
});
```

Tambahkan rute ke menu portal, misalnya `H.PORTALS.HRD.items.splice(i, 0, ['hrd-dx', 'Demo Experience Center', 'DX-HRD', 'ready', '', 'sub'])`. Status run disimpan di `state.dxlab[portal].runs[scenario] = { ctx, done, log }`.

## Pemakai
- HRD: `hawk-live/hrd-dx.js`. Tim Made Gunarsa, Harja, Ayu, Lead Human Growth; 5 skenario. Uji `tests/hawk-live/hrd-dx.e2e.js` 27/27.
- Operational, Commercial, Sales: didaftarkan oleh thread portal masing-masing.
