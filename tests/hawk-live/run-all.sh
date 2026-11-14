#!/usr/bin/env bash
# Jalankan semua uji hawk-live (butuh: python3 -m http.server 8811 dari root repo)
cd "$(dirname "$0")/../.." || exit 1
export BASE=${BASE:-http://localhost:8811/hawk-live/}
rc=0
for t in model.test.js design-lock.test.js $(ls tests/hawk-live | grep -E '^hrd-.*\.test\.js$') browser.e2e.js fase2.e2e.js budget2027.e2e.js portal-dx.e2e.js $(ls tests/hawk-live | grep -E '^hrd-.*\.e2e\.js$'); do
  r=$(node tests/hawk-live/$t 2>&1 | tail -1); echo "$t: $r"; [[ "$r" == *" 0 gagal"* ]] || rc=1
done
exit $rc
