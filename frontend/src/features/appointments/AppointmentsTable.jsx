import StatusBadge from "../../components/ui/StatusBadge";
const control = "w-full px-4 py-2.5 border rounded-xl text-sm bg-white";
export default function AppointmentsTable({
  appointments,
  filters,
  setFilters,
  pagination,
  onEditAppointment,
  onChangeStatus,
  busy,
}) {
  const set = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value, offset: 0 }));
  const setView = (e) => {
    const vista = e.target.value;
    setFilters((f) => ({
      ...f,
      vista,
      orden: vista === "HISTORIAL" ? "desc" : "asc",
      offset: 0,
    }));
  };
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const page = Math.floor(filters.offset / filters.limit) + 1;
  const goTo = (target) =>
    setFilters((f) => ({
      ...f,
      offset: (Math.min(Math.max(1, target), totalPages) - 1) * f.limit,
    }));
  return (
    <div className="bg-white rounded-3xl border shadow-soft overflow-hidden">
      <div className="p-5 bg-gray-50 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <select
          aria-label="Vista"
          className={control}
          value={filters.vista}
          onChange={setView}
          disabled={Boolean(filters.fecha)}
          title={
            filters.fecha
              ? "Con una fecha seleccionada se muestran solo las citas de ese día"
              : undefined
          }
        >
          <option value="PROXIMAS">Próximas citas</option>
          <option value="HISTORIAL">Historial</option>
          <option value="TODAS">Todas</option>
        </select>
        <select
          aria-label="Orden"
          title="Orden por fecha y hora de la cita"
          className={control}
          value={filters.orden}
          onChange={set("orden")}
        >
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </select>
        <input
          aria-label="Buscar citas"
          className={control}
          placeholder="Cliente, placa, documento o identificador"
          value={filters.q}
          onChange={set("q")}
        />
        <select
          aria-label="Estado"
          className={control}
          value={filters.estado}
          onChange={set("estado")}
        >
          {["ALL", "PENDIENTE", "EN_TALLER", "COMPLETADO", "CANCELADO"].map(
            (s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "Todos los estados" : s.replace("_", " ")}
              </option>
            ),
          )}
        </select>
        <input
          aria-label="Fecha"
          className={control}
          type="date"
          value={filters.fecha}
          onChange={set("fecha")}
        />
        <select
          aria-label="Turno"
          className={control}
          value={filters.turno}
          onChange={set("turno")}
        >
          <option value="ALL">Todos los turnos</option>
          <option value="MANANA">Mañana</option>
          <option value="TARDE">Tarde</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              {[
                "Fecha y hora",
                "Cliente y contacto",
                "Vehículo y placa",
                "Servicio",
                "Estado",
                "Acciones",
              ].map((h) => (
                <th key={h} className="p-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <strong>{a.date}</strong>
                  <div>{a.timeSlot}</div>
                </td>
                <td className="p-4">
                  <strong>{a.clientName}</strong>
                  <div className="text-xs">{a.dui}</div>
                  <div className="text-xs">{a.phone}</div>
                </td>
                <td className="p-4">
                  <strong>{a.placa}</strong>
                  <div>
                    {a.vehBrand} {a.vehModel}
                  </div>
                  <div className="text-xs text-gray-400">{a.vehType}</div>
                </td>
                <td className="p-4">
                  {a.service}
                  <div className="text-xs text-gray-400">{a.comments}</div>
                </td>
                <td className="p-4">
                  <StatusBadge status={a.status} />
                </td>
                <td className="p-4">
                  <button
                    disabled={busy}
                    className="text-blue-600 font-bold mb-2"
                    onClick={() => onEditAppointment(a)}
                  >
                    Editar
                  </button>
                  <select
                    aria-label={"Estado de " + a.placa}
                    disabled={busy}
                    className={control}
                    value={a.status}
                    onChange={(e) => onChangeStatus(a.id, e.target.value)}
                  >
                    {["PENDIENTE", "EN_TALLER", "COMPLETADO", "CANCELADO"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </td>
              </tr>
            ))}
            {!appointments.length && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400">
                  No se encontraron citas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 flex flex-wrap justify-between items-center gap-3 text-sm">
        <div className="flex items-center gap-3">
          <span>{total} citas encontradas</span>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            Por página
            <select
              aria-label="Citas por página"
              className="px-2 py-1 border rounded-lg bg-white"
              value={filters.limit}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  limit: Number(e.target.value),
                  offset: 0,
                }))
              }
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav aria-label="Paginación" className="flex items-center gap-3">
          <button disabled={busy || page <= 1} onClick={() => goTo(1)}>
            « Primera
          </button>
          <button disabled={busy || page <= 1} onClick={() => goTo(page - 1)}>
            Anterior
          </button>
          <span>
            Página{" "}
            <input
              aria-label="Ir a página"
              type="number"
              min={1}
              max={totalPages}
              key={page}
              defaultValue={page}
              onKeyDown={(e) => {
                if (e.key === "Enter") goTo(Number(e.currentTarget.value));
              }}
              onBlur={(e) => {
                if (Number(e.currentTarget.value) !== page)
                  goTo(Number(e.currentTarget.value));
              }}
              className="w-16 px-2 py-1 border rounded-lg text-center"
            />{" "}
            de {totalPages}
          </span>
          <button
            disabled={busy || !pagination || page >= totalPages}
            onClick={() => goTo(page + 1)}
          >
            Siguiente
          </button>
          <button
            disabled={busy || !pagination || page >= totalPages}
            onClick={() => goTo(totalPages)}
          >
            Última »
          </button>
        </nav>
      </div>
    </div>
  );
}
