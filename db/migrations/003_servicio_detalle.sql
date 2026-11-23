-- V7.1: descripción del servicio "Otros". Cambio aditivo e idempotente; no modifica datos existentes.
-- Aplicar ANTES de desplegar el backend V7.1. Hacer respaldo antes de aplicar.
DELIMITER $$
DROP PROCEDURE IF EXISTS migrate_bookit_v7_1$$
CREATE PROCEDURE migrate_bookit_v7_1()
BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cita' AND COLUMN_NAME='servicio_detalle') THEN
  ALTER TABLE cita ADD COLUMN servicio_detalle VARCHAR(200) NULL DEFAULT NULL AFTER servicio_codigo;
 END IF;
END$$
CALL migrate_bookit_v7_1()$$
DROP PROCEDURE migrate_bookit_v7_1$$
DELIMITER ;
