import { useState } from "react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { API_ROUTES as R } from "../../services/api/routes";
import { apiDownload } from "../../services/api/client";
import { useToast } from "../../context/ToastContext";
import RequestState from "../../components/ui/RequestState";
import {
  addDaysCivil,
  countCivilDays,
  formatDateShort,
  getTodayCivilDate,
} from "../../utils/dateUtils";

const MAX_DAYS = 30;
const PAGE = 25;
const ACTIONS = [
  "CREAR_CITA",
  "EDITAR_CITA",
  "CAMBIAR_ESTADO",
  "CONFIGURAR_AGENDA",
  "BLOQUEAR_AGENDA",
  "RETIRAR_BLOQUEO",
  "CREAR_REGISTRO",
  "EXPORTAR_AUDITORIA",
];
const MODULES = [
  "cita",
  "configuracion_agenda",
  "bloqueo_agenda",
  "cliente",
  "vehiculo",
  "log_auditoria",
];
const control = "px-3 py-2 border rounded-xl text-sm bg-white";

export function validateAuditRange(desde, hasta) {
  if (!desde || !hasta) return "Selecciona la fecha inicial y la final.";
  if (desde > hasta)
    return "La fecha inicial no puede ser posterior a la final.";
  if (countCivilDays(desde, hasta) > MAX_DAYS)
    return `El rango de consulta no puede superar ${MAX_DAYS} días.`;
  return null;
}

export default function AuditLogsViewer() {
  const { showToast } = useToast();
  const today = getTodayCivilDate();
  const [filters, setFilters] = useState({
    desde: addDaysCivil(today, 1 - MAX_DAYS),
    hasta: today,
    accion: "",
    entidad: "",
    q: "",
  });
  const [offset, setOffset] = useState(0);
  const [exporting, setExporting] = useState(false);
  const rangeError = validateAuditRange(filters.desde, filters.hasta);
  const query = useApiQuery(
    R.AUDITORIA_LOGS,
    { ...filters, limit: PAGE, offset },
    !rangeError,
  );
  const page = query.response?.pagination;
  const set = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setOffset(0);
  };
  const exportCsv = async () => {
    if (rangeError || exporting) return;
    setExporting(true);
    try {
      const name = await apiDownload(R.AUDITORIA_EXPORT, {
        queryParams: filters,
      });
      showToast(`Archivo ${name} descargado.`, "success");
      query.reload();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setExporting(false);
    }
  };
  return (
    <section className="bg-white rounded-3xl border shadow-soft p-6 space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-lg font-black">Auditoría de actividad</h3>
          <p className="text-xs text-gray-500">
            Consulta de máximo {MAX_DAYS} días por búsqueda. El historial
            completo se conserva.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={Boolean(rangeError) || exporting || !page?.total}
          className="px-4 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm disabled:opacity-50"
        >
          <i aria-hidden="true" className="fa-solid fa-file-csv mr-2"></i>
          {exporting ? "Exportando…" : "Exportar datos"}
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="text-xs font-bold text-gray-700">
          Desde
          <input
            type="date"
            aria-label="Auditoría desde"
            className={`${control} w-full mt-1`}
            max={today}
            value={filters.desde}
            onChange={set("desde")}
          />
        </label>
        <label className="text-xs font-bold text-gray-700">
          Hasta
          <input
            type="date"
            aria-label="Auditoría hasta"
            className={`${control} w-full mt-1`}
            max={today}
            value={filters.hasta}
            onChange={set("hasta")}
          />
        </label>
        <label className="text-xs font-bold text-gray-700">
          Acción
          <select
            aria-label="Acción"
            className={`${control} w-full mt-1`}
            value={filters.accion}
            onChange={set("accion")}
          >
            <option value="">Todas</option>
            {ACTIONS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-gray-700">
          Módulo
          <select
            aria-label="Módulo"
            className={`${control} w-full mt-1`}
            value={filters.entidad}
            onChange={set("entidad")}
          >
            <option value="">Todos</option>
            {MODULES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-gray-700">
          Usuario o identificador
          <input
            aria-label="Buscar en auditoría"
            className={`${control} w-full mt-1`}
            maxLength={150}
            value={filters.q}
            onChange={set("q")}
          />
        </label>
      </div>
      {rangeError ? (
        <p role="alert" className="text-sm font-bold text-red-600">
          {rangeError}
        </p>
      ) : (
        <p role="status" className="text-xs text-gray-500">
          Período: del {formatDateShort(filters.desde)} al{" "}
          {formatDateShort(filters.hasta)}
        </p>
      )}
      <RequestState
        loading={query.loading}
        error={query.error}
        onRetry={query.reload}
      />
      <div className="bg-gray-900 p-4 rounded-2xl font-mono text-xs text-gray-200 max-h-80 overflow-auto space-y-3">
        {(query.response?.data || []).map((log) => (
          <details key={log.id_log} className="border-b border-gray-700 pb-2">
            <summary className="cursor-pointer">
              {log.ocurrio_en} — {log.empleado} ({log.rol}): {log.accion} ·{" "}
              {log.entidad} {log.id_entidad}
            </summary>
            <pre className="whitespace-pre-wrap break-all mt-2 text-gray-400">
              {JSON.stringify(log.detalle, null, 2)}
            </pre>
          </details>
        ))}
        {query.response && !query.response.data.length && (
          <p>No hay actividad registrada en el período.</p>
        )}
      </div>
      <div className="flex gap-5 text-sm">
        <button
          disabled={query.loading || !offset}
          onClick={() => setOffset((o) => Math.max(0, o - PAGE))}
        >
          Anterior
        </button>
        <span>{page?.total ?? 0} eventos</span>
        <button
          disabled={query.loading || !page || offset + PAGE >= page.total}
          onClick={() => setOffset((o) => o + PAGE)}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
