const { test } = require("node:test");
const assert = require("node:assert/strict");
const { addDays, dateRange, daysBetween } = require("../lib/validation");
const { sanitize, csvCell } = require("../lib/auditExport");
test("rangos civiles: suma de días, límites y máximo de 30 días", () => {
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(daysBetween("2026-01-01", "2026-01-30"), 29);
  assert.deepEqual(dateRange({}), { desde: null, hasta: null });
  assert.deepEqual(
    dateRange({ desde: "2026-01-01", hasta: "2026-01-30" }, { maxDays: 30 }),
    { desde: "2026-01-01", hasta: "2026-01-30" },
  );
  assert.throws(
    () =>
      dateRange({ desde: "2026-01-01", hasta: "2026-01-31" }, { maxDays: 30 }),
    /30 días/,
  );
  assert.throws(() => dateRange({ desde: "2026-01-01" }, { maxDays: 30 }));
  assert.throws(() => dateRange({ desde: "2026-02-02", hasta: "2026-02-01" }));
  assert.throws(() => dateRange({ desde: "2026-02-30" }));
});
test("exportación CSV: escapa comillas y neutraliza fórmulas", () => {
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(15), "15");
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(csvCell("+1"), "'+1");
  assert.equal(csvCell("@x"), "'@x");
});
test("auditoría: se omiten claves sensibles en cualquier nivel", () => {
  assert.deepEqual(
    sanitize({
      antes: { contrasena_hash: "x", nombre: "Ana" },
      lista: [{ token: "t", ok: 1 }],
      csrf: "c",
    }),
    { antes: { nombre: "Ana" }, lista: [{ ok: 1 }] },
  );
});
