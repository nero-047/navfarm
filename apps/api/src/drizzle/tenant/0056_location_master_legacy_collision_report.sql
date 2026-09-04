-- 0055 backfilled farm_master / shed_master / warehouse_master rows into
-- `location_master` using INSERT IGNORE. Those legacy tables each enforce
-- their location codes as unique only WITHIN their own table, but
-- `location_master` carries `uq_location_master_tenant_company_code
-- UNIQUE(tenant_id, company_id, location_code)`. A farm and a warehouse
-- sharing a code in the same company therefore collide on that constraint,
-- and INSERT IGNORE silently drops the second row — a location simply goes
-- missing, with no error anywhere.
--
-- 0055 has already run against real databases, so its statements are not
-- rewritten here (that would not undo damage already done, and could double
-- up rows on a second run). Instead this migration re-checks the outcome:
-- any legacy row that still has no matching `location_master.location_id`
-- was either dropped by that collision or is new legacy data added since.
-- Either way we FAIL loudly rather than invent a suffixed location_code
-- ourselves — location_code is a user-facing / ERP-facing identifier, and
-- manufacturing one without the data owner's say-so is its own kind of data
-- corruption. An operator who hits this should run the SELECT below to see
-- the exact rows, resolve the source-table code collision, then re-run
-- migrations; this migration is safe to re-run as-is.
--
-- Diagnostic query for an operator to run by hand when this migration fails:
--   SELECT 'FARM' AS source_table, farm_id AS id, tenant_id, company_id, farm_code AS location_code FROM farm_master WHERE farm_id NOT IN (SELECT location_id FROM location_master)
--   UNION ALL
--   SELECT 'SHED', shed_id, tenant_id, company_id, shed_code FROM shed_master WHERE shed_id NOT IN (SELECT location_id FROM location_master)
--   UNION ALL
--   SELECT 'WAREHOUSE', warehouse_id, tenant_id, company_id, warehouse_code FROM warehouse_master WHERE warehouse_id NOT IN (SELECT location_id FROM location_master);
DROP PROCEDURE IF EXISTS `sp_report_location_master_backfill_collisions`;--> statement-breakpoint
CREATE PROCEDURE `sp_report_location_master_backfill_collisions`()
BEGIN
  DECLARE missing_count INT DEFAULT 0;

  SELECT COUNT(*) INTO missing_count FROM (
    SELECT farm_id AS id FROM farm_master
    WHERE farm_id NOT IN (SELECT location_id FROM location_master)
    UNION ALL
    SELECT shed_id AS id FROM shed_master
    WHERE shed_id NOT IN (SELECT location_id FROM location_master)
    UNION ALL
    SELECT warehouse_id AS id FROM warehouse_master
    WHERE warehouse_id NOT IN (SELECT location_id FROM location_master)
  ) AS missing;

  IF missing_count > 0 THEN
    -- MySQL caps SIGNAL MESSAGE_TEXT at 128 chars, so the full explanation
    -- and the remediation query live in this file's header comment instead.
    SET @msg = CONCAT('location_master backfill: ', missing_count,
      ' legacy row(s) missing (location_code collision?). See 0056 migration for diagnostic query.');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @msg;
  END IF;
END;--> statement-breakpoint
CALL `sp_report_location_master_backfill_collisions`();--> statement-breakpoint
DROP PROCEDURE IF EXISTS `sp_report_location_master_backfill_collisions`;
