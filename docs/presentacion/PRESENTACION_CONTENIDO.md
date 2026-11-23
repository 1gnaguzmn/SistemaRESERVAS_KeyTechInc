# Presentación — contenido editable

Archivo editable: `Presentacion_Mejoras_V7_1.pptx` (PowerPoint, Google Slides o Keynote). Este documento contiene el mismo texto para reutilizarlo en otro formato.

1. **Portada.** Mejoras del sistema de reservas. Respuesta a la retroalimentación del cliente, versión 7.1. Taller Bautista · KeyTech Inc.
2. **Contexto y objetivo.**
   - Se trabajó sobre el sistema actual, sin reconstruirlo ni perder datos.
   - Los cambios están en una rama independiente y se revisan en un Pull Request.
   - El único cambio de base de datos es una columna opcional.
   - Se mantienen las mismas reglas de seguridad.
   - Se validó con pruebas automáticas y funcionales.
3. **Requerimientos atendidos** (tabla RF-01 a RF-06):

   | RF | Solicitud | Solución |
   |---|---|---|
   | 01 | Servicio “Otros” | Nuevo servicio con descripción obligatoria |
   | 02 | Vehículo | Solo placa y modelo obligatorios |
   | 03 | Listado de Secretaría | Orden ascendente desde hoy, historial y paginación completa |
   | 04 | Vista del jefe | Abre en la fecha de hoy (El Salvador) |
   | 05 | Rangos de fecha | Hoy, ±15 días, último/próximo mes, personalizado |
   | 06 | Auditoría | Máximo 30 días por consulta + exportación CSV |

4. **RF-01 y RF-02 · Registro de citas.**
   - Con “Otros” aparece una descripción obligatoria (hasta 200 caracteres), validada en el servidor.
   - El servicio se muestra como “Otros: …”.
   - Vehículo: placa y modelo obligatorios. Los vehículos existentes conservan sus datos.
   - Captura: formulario con “Otros”.
5. **RF-03 · Listado de Secretaría.**
   - Vista inicial: próximas citas desde hoy, en orden ascendente; opciones Historial y Todas.
   - Página X de Y, Primera/Última, ir a una página y 10–100 citas por página.
   - Probado con 17 páginas: 161 citas sin omisiones ni duplicados.
6. **RF-04 y RF-05 · Tablero del jefe.**
   - Abre en Hoy (El Salvador).
   - Períodos: ±15 días, mes calendario anterior/siguiente completo y rango personalizado validado.
   - Una etiqueta indica el período visible.
7. **RF-06 · Auditoría.**
   - Últimos 30 días por defecto; los rangos mayores se rechazan.
   - Filtros por acción, módulo y usuario.
   - Exportación CSV completa, sin datos sensibles, protegida contra fórmulas y registrada en la auditoría.
   - Roles: Secretaría, Administración y Dueño.
8. **Calidad y pruebas.**
   - Pruebas unitarias 6/6 e integración 17/17; build aprobado.
   - Pruebas funcionales de los 6 requerimientos y regresión aprobadas, sin usar producción.
9. **Publicación segura.**
   - Pasos: aprobar el PR → respaldar → migración 003 → publicar → verificación rápida.
   - Reversión: volver a la versión anterior, sin pérdida de datos.
10. **Próximos pasos.**
    - Validación del cliente.
    - Autorizar la publicación.
    - Capacitación por rol.
