/* HAWK Integration Adapter
   ┌──────────────┐     HAWK.api.call(op, payload)      ┌──────────────────┐
   │  UI screens  │ ──────────────────────────────────▶ │  active adapter   │
   └──────────────┘                                     ├──────────────────┤
                                                        │ A. MockAdapter    │ → store.js handlers (DEMO state, localStorage)
                                                        │ B. HawkApiAdapter │ → NOT CONNECTED: returns NOT_CONNECTED with contract
                                                        └──────────────────┘
   UI code never touches the store directly for writes. Replace B's `transport` with verified HAWK APIs
   operation-by-operation (see INTEGRATION_CONTRACTS.md and DEVELOPER_HANDOFF.md §4). */
(function (root) {
  'use strict';
  const HAWK = (root.HAWK = root.HAWK || {});

  /* ---- A. Mock adapter (used by the interactive prototype) ---- */
  class MockAdapter {
    constructor(store) {
      this.store = store;
      this.name = 'MOCK';
      this.net = 'OK'; // OK | SLOW | FAIL — demo of loading / error states only
    }
    call(op, payload, user) {
      const contract = HAWK.contract(op);
      if (!contract) return { ok: false, error: { code: 'NO_CONTRACT', message: 'Operasi tidak terdaftar di kontrak: ' + op } };
      // DEMO permission check — the production backend MUST enforce this independently (UI checks are not security)
      if (!HAWK.roleAllows(contract.roles, user)) return { ok: false, error: { code: 'FORBIDDEN', message: `Role ${HAWK.ROLE_LABEL[user.role] || user.role} tidak berwenang untuk ${op}` } };
      // UI-state simulation (MP-HAWK-03 §4): FAIL mode returns a retryable transport error and changes nothing
      if (this.net === 'FAIL') return { ok: false, error: { code: 'NETWORK_ERROR', retryable: true, message: 'Simulasi gagal koneksi — tidak ada data yang berubah. Coba lagi, atau kembalikan Kondisi ke Normal.' } };
      try {
        const data = this.store.exec(op, payload, user);
        return { ok: true, data, op, status: contract.status };
      } catch (e) {
        return { ok: false, error: { code: e.code || 'ERROR', message: e.message, detail: e.detail } };
      }
    }
  }

  /* ---- B. HAWK API adapter (placeholder — intentionally NOT connected) ----
     For each operation:
       1. Verify the existing HAWK endpoint / service (engine documentation or tested call).
       2. Implement mapRequest/mapResponse in `mappings[op]`.
       3. Change the contract status in contracts.js from TO VERIFY → CONFIRMED EXISTING (with evidence link).
     Until then every call returns NOT_CONNECTED. No endpoint names are invented here. */
  class HawkApiAdapter {
    constructor(opts = {}) {
      this.name = 'HAWK_API';
      this.transport = opts.transport || null; // e.g. async (opName, body) => response — supplied by HAWK dev team
      this.mappings = opts.mappings || {}; // { 'mrf.create': { mapRequest, mapResponse } }
    }
    call(op, payload, user) {
      const contract = HAWK.contract(op);
      if (!this.transport || !this.mappings[op])
        return { ok: false, error: { code: 'NOT_CONNECTED', message: `Belum terhubung ke HAWK engine untuk ${op} (status kontrak: ${contract ? contract.status : 'tidak ada'})`, contract } };
      // Real implementation will be async: return this.transport(...).then(mapResponse)
      return { ok: false, error: { code: 'ASYNC_REQUIRED', message: 'Implementasi produksi harus asinkron (Promise)' } };
    }
  }

  HAWK.MockAdapter = MockAdapter;
  HAWK.HawkApiAdapter = HawkApiAdapter;
  HAWK.createApi = function (store) {
    const mock = new MockAdapter(store);
    const live = new HawkApiAdapter();
    const api = {
      mode: 'MOCK',
      adapters: { MOCK: mock, HAWK_API: live },
      setMode(m) {
        api.mode = m;
      },
      call(op, payload, user) {
        return api.adapters[api.mode].call(op, payload, user);
      },
      can(op, who) {
        const c = HAWK.contract(op);
        return !!c && HAWK.roleAllows(c.roles, typeof who === 'string' ? { role: who } : who);
      },
    };
    return api;
  };

  /* Super Admin (Owner 9 Nov 2026): an OWNER-role account flagged superAdmin also keeps every Super Admin (ADMIN) operation. */
  HAWK.roleAllows = (roles, user) => !!user && (roles.includes(user.role) || (!!user.superAdmin && roles.includes('ADMIN')));
  HAWK.ROLE_LABEL = {
    OWNER: 'Owner / Eksekutif', BU_MANAGER: 'BU Manager', HEAD_DIV: 'Head of Division', SUPERVISOR: 'Supervisor Outlet', STAFF: 'Staff / Therapist / Housekeeping',
    PURCHASING: 'Purchasing', WAREHOUSE: 'Gudang / Receiving', FINANCE: 'Finance / Accounting', ASSET: 'Asset / Facility PIC', ADMIN: 'System Administrator',
  };
  // Rule-engine actor (Order Sederhana, AR-13). Non-enumerable: never offered as a login role or assignable role.
  Object.defineProperty(HAWK.ROLE_LABEL, 'SYSTEM', { value: 'Sistem (aturan otomatis)', enumerable: false });
  // Approval step held by a position (not a login role): Assistant Operational Manager (role HEAD_DIV + position ASST_OM).
  Object.defineProperty(HAWK.ROLE_LABEL, 'ASST_OM', { value: 'Asisten Operational Manager', enumerable: false });
})(typeof window !== 'undefined' ? window : globalThis);
