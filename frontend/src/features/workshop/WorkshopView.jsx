import { useEffect, useState } from "react";
import { useAgenda } from "../../context/AgendaContext";
import { useApiQuery } from "../../hooks/useApiQuery";
import { apiRequest } from "../../services/api/client";
import { API_ROUTES as R } from "../../services/api/routes";
import { toUIAppointment } from "../../adapters/appointmentAdapter";
import { useToast } from "../../context/ToastContext";
import RequestState from "../../components/ui/RequestState";
import KanbanBoard from "./KanbanBoard";
import EditBookingModal from "../appointments/EditBookingModal";
import {
  formatDateShort,
  getPeriodRange,
  getTodayCivilDate,
  WORKSHOP_PERIODS,
} from "../../utils/dateUtils";
export default function WorkshopView() {
  const { services, changeKanbanStep } = useAgenda(),
    { showToast } = useToast();
  const [filters, setFilters] = useState(() => ({
      periodo: "HOY",
      ...getPeriodRange("HOY"),
      turno: "ALL",
    })),
    [columns, setColumns] = useState([]),
    [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false);
  const validRange =
    Boolean(filters.desde && filters.hasta) && filters.desde <= filters.hasta;
  const boardQuery = {
    desde: filters.desde,
    hasta: filters.hasta,
    turno: filters.turno,
  };
  const query = useApiQuery(R.WORKSHOP, boardQuery, validRange);
  const periodName = WORKSHOP_PERIODS.find(
    (p) => p.value === filters.periodo,
  )?.label;
  const periodLabel = !validRange
    ? "Selecciona un rango válido: la fecha inicial no puede ser posterior a la final."
    : filters.desde === filters.hasta
      ? `${periodName}: ${formatDateShort(filters.desde)}${filters.desde === getTodayCivilDate() ? " (hoy)" : ""}`
      : `${periodName}: del ${formatDateShort(filters.desde)} al ${formatDateShort(filters.hasta)}`;
  useEffect(() => {
    if (query.response) setColumns(query.response.data.columnas);
  }, [query.response]);
  useEffect(() => {
    if (!validRange) setColumns([]);
  }, [validRange]);
  const move = async (id, step) => {
    if (busy) return;
    setBusy(true);
    try {
      await changeKanbanStep(id, step);
    } finally {
      setBusy(false);
    }
  };
  const load = async (estado) => {
    if (busy) return;
    setBusy(true);
    try {
      const current = columns.find((c) => c.estado === estado);
      const result = await apiRequest(R.CITAS_LIST, {
        queryParams: {
          ...boardQuery,
          estado,
          limit: 25,
          offset: current.data.length,
        },
      });
      setColumns((prev) =>
        prev.map((c) =>
          c.estado === estado
            ? {
                ...c,
                data: [
                  ...c.data,
                  ...result.data.filter(
                    (r) => !c.data.some((x) => x.id_cita === r.id_cita),
                  ),
                ],
                pagination: result.pagination,
              }
            : c,
        ),
      );
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const appointments = columns
    .flatMap((c) => c.data)
    .map((a) => toUIAppointment(a, services));
  return (
    <div className="space-y-6 fade-in">
      <div className="bg-white p-6 rounded-3xl border shadow-soft">
        <h2 className="text-xl font-black">
          Control Operativo de Taller (Kanban)
        </h2>
        <p className="text-sm text-gray-500">
          Las citas canceladas quedan excluidas del tablero.
        </p>
      </div>
      <RequestState
        loading={query.loading}
        error={query.error}
        onRetry={query.reload}
      />
      <KanbanBoard
        appointments={appointments}
        onMoveKanban={move}
        onEditAppointment={setSelected}
        filters={filters}
        setFilters={setFilters}
        periodLabel={periodLabel}
        validRange={validRange}
        columnsData={columns}
        onLoadMore={load}
        busy={busy || query.loading}
      />
      <EditBookingModal
        isOpen={!!selected}
        appointment={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
