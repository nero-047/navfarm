-- Adds the FK behind item_master.tracking_series_id, which points at the number
-- series an item's lot/serial numbers are drawn from.
--
-- Conditional, because the tenant databases disagree about whether the
-- constraint is already there: tenant_system carries it, tenant_devco was
-- created from a baseline that never had it. A bare ADD CONSTRAINT fails on the
-- first, a bare DROP fails on the second, and a migration that cannot run in
-- every tenant blocks every migration behind it — which is exactly what the
-- pair this replaces did.
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'item_master'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'item_master_tracking_series_id_no_series_master_series_id_fk'
);--> statement-breakpoint
SET @ddl := IF(@fk_exists = 0,
  'ALTER TABLE `item_master` ADD CONSTRAINT `item_master_tracking_series_id_no_series_master_series_id_fk` FOREIGN KEY (`tracking_series_id`) REFERENCES `no_series_master`(`series_id`) ON DELETE restrict ON UPDATE no action',
  'SELECT 1'
);--> statement-breakpoint
PREPARE add_fk FROM @ddl;--> statement-breakpoint
EXECUTE add_fk;--> statement-breakpoint
DEALLOCATE PREPARE add_fk;
