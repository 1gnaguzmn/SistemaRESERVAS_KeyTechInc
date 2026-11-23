# Documentación técnica — Mejoras V7.1 (feedback del cliente)

**Sistema:** Sistema de reservas · Taller Bautista (KeyTech Inc.)
**Rama:** `feature/mejoras-feedback-cliente` · **PR:** #11 (sin merge ni despliegue)
**Zona horaria de negocio:** `America/El_Salvador`

## 1. Resumen ejecutivo

Tras la presentación al cliente se implementaron seis mejoras (RF-01 a RF-06) **sobre la implementación existente**, sin reconstruir el sistema. Los cambios son:

- servicio “Otros” con descripción obligatoria;
- formulario de vehículo simplificado;
- listado de Secretaría con orden y paginación completos;
- vista del jefe de taller que abre en el día actual y ofrece rangos de fechas;
- auditoría limitada a 30 días por consulta, con exportación CSV.

El único cambio de base de datos es **aditivo**: una columna nullable nueva. No se eliminan ni transforman datos.

## 2. Arquitectura (sin cambios estructurales)

| Capa | Tecnología | Ubicación |
|---|---|---|
| Frontend | React 18, Vite, React Router, Tailwind CSS | `frontend/` |
| Backend | Node.js, Express 5 (CommonJS), mysql2, cookie-session, bcryptjs | `src/` |
| Base de datos | MySQL 8 (InnoDB), procedimientos almacenados y triggers | `db/` |
| Contrato | OpenAPI 3.1 | `src/openapi.json` |
| Despliegue | `Dockerfile` (Node 22) en Railway; Express sirve `frontend/dist` | raíz |

**Seguridad (se mantiene):**
- cookie firmada `bookit.sid` HttpOnly/SameSite=Lax (Secure en producción) con duración de 8 h;
- verificación de `Origin` y `X-CSRF-Token` en las escrituras;
- roles validados en el servidor: `SECRETARIA`, `JEFE_TALLER`, `ADMIN` y `DUENO`.

## 3. Requerimientos y solución

### RF-01 — Servicio “Otros”
- Catálogo (`src/config/services.js`): nuevo `{ codigo: "OTROS", nombre: "Otros", requiere_detalle: true }`. Los cinco códigos existentes no cambian.
- BD: nueva columna `cita.servicio_detalle VARCHAR(200) NULL` (migración `003`).
- Validación en el servidor (`citaInput()` en `src/services/agendamientoService.js`):
  - si el servicio tiene `requiere_detalle`, la descripción no vacía es obligatoria (máximo 200 caracteres);
  - en los demás servicios se guarda `NULL`, también al cambiar de “Otros” a otro servicio.
- Persistencia (`src/models/Cita.js`): el alta sigue usando `sp_registrar_cita_tx` sin cambiar su firma. A continuación, **en la misma transacción**, se ejecuta `UPDATE cita SET servicio_detalle=?`. Si algo falla, todo se revierte.
- Frontend:
  - `BookingForm.jsx` muestra el campo “Describe el servicio requerido *” solo con “Otros” y bloquea el envío si está vacío;
  - el adaptador muestra el servicio como `Otros: <descripción>` en la tabla, las tarjetas Kanban y la edición.

### RF-02 — Vehículo simplificado
- Obligatorios: **placa** y **modelo**. Opcionales: marca, año y color. Tipo: `GENERAL` por defecto.
- `vehicleInput()` solo incluye `marca`/`tipo` cuando la petición los envía, así que **un vehículo existente no pierde su marca ni su tipo** si se agenda solo con placa y modelo.
- El esquema SQL ya permitía `NULL` en `marca`; no hubo cambios de BD.

### RF-03 — Listado de Secretaría
- Diagnóstico: el backend ya ordenaba de forma ascendente y **no tenía límite de 10 páginas**. La interfaz solo mostraba Anterior/Siguiente, sin número de página ni total.
- API `GET /api/citas`, nuevos parámetros:
  - `desde`, `hasta`: fechas civiles incluidas (`inicio >= desde 00:00` y `inicio < hasta+1 00:00`);
  - `orden=asc|desc`: `asc` por defecto, con `ORDER BY c.inicio, c.id_cita` para una paginación determinista sin omisiones ni duplicados.
- Interfaz (`AppointmentsTable.jsx`, `SecretaryView.jsx`):
  - vista por defecto **Próximas citas (desde hoy)** en orden ascendente; también **Historial** (antes de hoy, descendente) y **Todas**;
  - selector de orden;
  - **Página X de Y**, Primera, Anterior, Siguiente, Última y campo “Ir a página”;
  - tamaño de página de 10, 25, 50 o 100;
  - cada cambio de filtro vuelve a la página 1.

### RF-04 / RF-05 — Vista del jefe de taller
- API `GET /api/taller/tablero`: acepta `desde`/`hasta`, con la misma semántica.
- `WorkshopView.jsx` abre en **Hoy**, según la fecha civil de El Salvador (`getTodayCivilDate()`), en lugar de mostrar todas las fechas.
- Períodos (`getPeriodRange()` en `frontend/src/utils/dateUtils.js`), ambos extremos incluidos:

| Período | Rango |
|---|---|
| Hoy | hoy … hoy |
| Últimos 15 días | hoy − 14 … hoy |
| Próximos 15 días | hoy … hoy + 14 |
| Último mes | mes calendario anterior completo (día 1 … último día) |
| Próximo mes | mes calendario siguiente completo (día 1 … último día) |
| Rango personalizado | fechas elegidas; si inicio > fin, se muestra un error y no se consulta |

- Ejemplo con hoy = 22/11/2026: Último mes = 01/10/2026 … 31/10/2026; Próximo mes = 01/12/2026 … 31/12/2026. Se respetan años bisiestos y cambios de año.
- Una etiqueta indica el período activo. “Cargar más” respeta el rango y descarta duplicados.

### RF-06 — Auditoría con límite de 30 días y exportación
- `GET /api/auditoria`:
  - nuevos filtros `desde`, `hasta`, `accion`, `entidad` y `q`;
  - sin fechas, se usan los **últimos 30 días** (hoy incluido);
  - si se envía una fecha, la otra es obligatoria; un rango de más de 30 días responde `400 VALIDATION_ERROR`;
  - la respuesta incluye `filtros: { desde, hasta }`.
- `GET /api/auditoria/exportar` (nuevo):
  - devuelve un CSV UTF-8 con BOM (Excel muestra bien los acentos) con **todas** las filas filtradas, sin paginar;
  - columnas: `id_log, fecha_hora, usuario, rol, accion, modulo, id_relacionado, descripcion`;
  - omite de forma recursiva las claves sensibles del JSON (`contrasena|password|hash|token|csrf|secret`);
  - neutraliza la inyección de fórmulas: las celdas que empiezan con `= + - @` llevan un apóstrofo delante;
  - exige `X-CSRF-Token` porque registra un evento, lo que evita exportaciones forzadas desde otro sitio;
  - registra la acción `EXPORTAR_AUDITORIA` en la misma bitácora inmutable.
- Permisos: los mismos roles que ya consultaban la auditoría (**Secretaría, Administración y Dueño**). El Jefe de taller recibe `403`.
- La interfaz (`AuditLogsViewer.jsx`):
  - filtros Desde/Hasta (últimos 30 días por defecto), Acción, Módulo y Usuario/identificador;
  - mensaje de validación inmediato si el rango no es válido;
  - botón **Exportar datos**, deshabilitado si el rango no es válido o no hay resultados.

## 4. Archivos modificados

| Área | Archivos |
|---|---|
| Configuración | `src/config/services.js` |
| Validación | `src/lib/validation.js` (`addDays`, `daysBetween`, `dateRange`), `src/lib/auditExport.js` (nuevo) |
| Servicios | `src/services/agendamientoService.js`, `agendaReadService.js`, `adminService.js` |
| Modelo | `src/models/Cita.js` |
| Rutas/seguridad | `src/routes/apiRoutes.js`, `src/middleware/session.js` (`requireCsrf`) |
| BD | `db/DataBase(1).sql`, `db/migrations/003_servicio_detalle.sql` (nuevo) |
| Contrato | `src/openapi.json` |
| Frontend | `BookingForm.jsx`, `AppointmentsTable.jsx`, `SecretaryView.jsx`, `WorkshopView.jsx`, `KanbanBoard.jsx`, `AuditLogsViewer.jsx`, `appointmentAdapter.js`, `AgendaContext.jsx`, `services/api/client.js` (`apiDownload`), `services/api/routes.js`, `utils/dateUtils.js` |
| Pruebas | `src/test/feedback.test.js` (nuevo), `src/test/integration/api.test.js` |
| Documentación | `README.md`, `docs/` (`.gitignore` ya no excluye `docs/`) |

## 5. Cambios de API (resumen)

| Método y ruta | Cambio |
|---|---|
| `GET /api/servicios` | Incluye `OTROS` con `requiere_detalle: true` |
| `POST /api/citas/manuales`, `PUT /api/citas/:id` | `cita.servicio_detalle` (obligatorio con `OTROS`); `vehiculo.marca` y `vehiculo.tipo` opcionales |
| `GET /api/citas`, `GET /api/citas/:id` | Respuesta incluye `servicio_detalle`; filtros `desde`, `hasta`, `orden` |
| `GET /api/taller/tablero` | Filtros `desde`, `hasta` |
| `GET /api/auditoria` | Filtros `desde`, `hasta` (máx. 30 días), `accion`, `entidad`, `q`; campo `filtros` |
| `GET /api/auditoria/exportar` | **Nuevo**: CSV; requiere sesión, rol autorizado y `X-CSRF-Token` |

Todos los cambios son compatibles con clientes anteriores: solo se agregan parámetros opcionales y campos de respuesta.

## 6. Base de datos y migración

`db/migrations/003_servicio_detalle.sql`:
- agrega `servicio_detalle VARCHAR(200) NULL` después de `servicio_codigo`, solo si la columna no existe (consulta `information_schema`);
- es idempotente: ejecutarla dos veces no produce errores, y está verificado en las pruebas de integración;
- no modifica filas ni procedimientos almacenados.

**Orden obligatorio:** respaldar la BD → aplicar `003` → desplegar el backend. El backend V7.1 lee la columna, así que si se despliega antes de migrar, el listado de citas fallará.

## 7. Validación y pruebas

| Suite | Comando | Resultado |
|---|---|---|
| Unitarias backend | `npm --prefix src test` | 6/6 aprobadas (3 existentes + 3 nuevas) |
| Integración (MySQL 8 desechable, `bookit_v6_feedback_test`) | `TEST_DB_NAME=… npm --prefix src run test:integration` | 17/17 aprobadas (12 existentes + 5 nuevas para RF-01 a RF-06) |
| Build frontend | `npm --prefix frontend run build` | Aprobado |
| E2E Playwright | `npm --prefix frontend run test:e2e` | **No ejecutada**: `frontend/test/e2e.mjs` no existe en `main` (se eliminó en v7.0.1) aunque `package.json` la referencia |
| Prueba funcional en navegador | Manual/asistida sobre una BD local desechable | Aprobada: ver `docs/VALIDACION.md` |

Las pruebas de integración nuevas cubren:
- RF-01: catálogo con `OTROS`; descripción vacía rechazada (400); la descripción se guarda y se recupera; se limpia al cambiar a otro servicio.
- RF-02: alta con solo placa y modelo; marca vacía permitida; sin modelo o sin placa, 400; un vehículo existente conserva marca y tipo `PESADO`.
- RF-03: más de 10 páginas recorridas sin omisiones ni duplicados; orden asc/desc; filtros `desde`/`hasta`.
- RF-04/05: tablero filtrado por rango.
- RF-06: más de 30 días, 400; una sola fecha, 400; ventana por defecto; filtro por acción; CSV con BOM, cabecera y número de filas igual al total; Jefe 403; sin sesión 401; sin CSRF 403.

## 8. Despliegue (requiere autorización explícita del responsable)

1. Revisar y aprobar el PR #11.
2. Respaldar la BD de Railway (snapshot o `mysqldump`).
3. Ejecutar `db/migrations/003_servicio_detalle.sql` sobre la BD de Railway.
4. Verificar la columna: `SHOW COLUMNS FROM cita LIKE 'servicio_detalle';`.
5. Hacer merge a `main`; Railway reconstruye la imagen.
6. Prueba rápida:
   - iniciar sesión;
   - crear una cita con “Otros”;
   - revisar la vista del jefe (Hoy);
   - exportar la auditoría.

No hay variables de entorno ni credenciales nuevas.

## 9. Rollback seguro

1. **Aplicación:** en Railway, volver a desplegar la imagen/commit anterior (o revertir el merge con `git revert`). El backend anterior no lee `servicio_detalle`, así que convive con la columna.
2. **Base de datos:** **no es necesario** revertir la migración. La columna es nullable y no afecta a la versión anterior. Solo si se decide eliminarla:
   - respaldar antes;
   - ejecutar `ALTER TABLE cita DROP COLUMN servicio_detalle;`;
   - **esto borra las descripciones de “Otros”**.
3. **Datos creados con V7.1:** las citas con `servicio_codigo='OTROS'` se conservan. La versión anterior las muestra con el código crudo `OTROS`, y para editarlas habrá que elegir uno de los cinco servicios originales.

## 10. Riesgos y consideraciones

- Si `003` no se aplica antes del deploy, fallan las consultas de citas (mitigado con el orden obligatorio de la sección 8).
- La exportación CSV no tiene límite de filas: está acotada por la ventana de 30 días.
- La UI no tiene módulos de “gestión de usuarios” ni de “administración de servicios”. Los usuarios se crean con `src/scripts/provisionEmployee.js` y el catálogo de servicios es fijo en código.
