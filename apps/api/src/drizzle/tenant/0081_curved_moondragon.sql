-- Collapse farm_master, shed_master and warehouse_master into location_master.
--
-- These three were never independent masters: location.service.ts wrote a
-- mirror row into each carrying the SAME id as its location, so farm_id,
-- shed_id and warehouse_id were always equal to a location_id. One master, one
-- table — a farm, shed, pen, store or silo is a location_master row identified
-- by location_type and positioned by parent_location_id.
--
-- Order matters: every foreign key INTO the three tables has to go before the
-- tables can be dropped, and any mirror row without a location behind it has to
-- be backfilled before the new keys can point at location_master.

-- 1. Drop every foreign key that references the three tables.
ALTER TABLE `batch_header` DROP FOREIGN KEY `batch_header_shed_id_fk`;--> statement-breakpoint
ALTER TABLE `batch_output_line` DROP FOREIGN KEY `batch_output_line_warehouse_id_warehouse_master_warehouse_id_fk`;--> statement-breakpoint
ALTER TABLE `goods_issue` DROP FOREIGN KEY `goods_issue_warehouse_id_warehouse_master_warehouse_id_fk`;--> statement-breakpoint
ALTER TABLE `goods_receipt` DROP FOREIGN KEY `goods_receipt_warehouse_id_warehouse_master_warehouse_id_fk`;--> statement-breakpoint
ALTER TABLE `inventory_ledger` DROP FOREIGN KEY `inventory_ledger_warehouse_id_warehouse_master_warehouse_id_fk`;--> statement-breakpoint
ALTER TABLE `location_master` DROP FOREIGN KEY `location_master_warehouse_id_warehouse_master_warehouse_id_fk`;--> statement-breakpoint
ALTER TABLE `location_master` DROP FOREIGN KEY `loc_master_farm_id_fk`;--> statement-breakpoint
ALTER TABLE `location_master` DROP FOREIGN KEY `loc_master_shed_id_fk`;--> statement-breakpoint
ALTER TABLE `operational_area_master` DROP FOREIGN KEY `fk_op_area_farm`;--> statement-breakpoint
ALTER TABLE `qr_code_master` DROP FOREIGN KEY `qr_code_master_warehouse_id_warehouse_master_warehouse_id_fk`;--> statement-breakpoint
ALTER TABLE `stock_adjustment` DROP FOREIGN KEY `stock_adjustment_warehouse_id_warehouse_master_warehouse_id_fk`;--> statement-breakpoint
ALTER TABLE `stock_transfer` DROP FOREIGN KEY `stock_transfer_from_warehouse_fk`;--> statement-breakpoint
ALTER TABLE `stock_transfer` DROP FOREIGN KEY `stock_transfer_to_warehouse_fk`;--> statement-breakpoint

-- 2. Backfill. A mirror written directly by an old seed script has no location
--    row behind it; without this the new foreign keys below would be rejected.
--    Farms first, then sheds under them, then stores and silos.
INSERT INTO `location_master`
  (`location_id`, `tenant_id`, `company_id`, `nob_id`, `lob_id`, `farm_id`,
   `location_code`, `location_name`, `location_level`, `location_type`,
   `max_capacity`, `capacity_uom`, `is_active`, `status`, `deleted_at`)
SELECT f.`farm_id`, f.`tenant_id`, f.`company_id`, f.`nob_id`, f.`lob_id`, f.`farm_id`,
       f.`farm_code`, f.`farm_name`, 1, 'FARM',
       f.`capacity`, 'HEAD', f.`is_active`, f.`status`, f.`deleted_at`
FROM `farm_master` f
WHERE NOT EXISTS (SELECT 1 FROM `location_master` l WHERE l.`location_id` = f.`farm_id`);--> statement-breakpoint

INSERT INTO `location_master`
  (`location_id`, `tenant_id`, `company_id`, `nob_id`, `lob_id`, `farm_id`, `shed_id`,
   `location_code`, `location_name`, `location_level`, `location_type`, `parent_location_id`,
   `max_capacity`, `capacity_uom`, `is_active`, `status`, `deleted_at`)
SELECT s.`shed_id`, s.`tenant_id`, s.`company_id`, s.`nob_id`, s.`lob_id`, s.`farm_id`, s.`shed_id`,
       s.`shed_code`, s.`shed_name`, 2, 'SHED', s.`farm_id`,
       s.`capacity`, 'HEAD', s.`is_active`, s.`status`, s.`deleted_at`
FROM `shed_master` s
WHERE NOT EXISTS (SELECT 1 FROM `location_master` l WHERE l.`location_id` = s.`shed_id`);--> statement-breakpoint

INSERT INTO `location_master`
  (`location_id`, `tenant_id`, `company_id`, `farm_id`, `warehouse_id`,
   `location_code`, `location_name`, `location_level`, `location_type`, `parent_location_id`,
   `storage_type`, `is_active`, `status`, `deleted_at`)
SELECT w.`warehouse_id`, w.`tenant_id`, w.`company_id`, w.`farm_id`, w.`warehouse_id`,
       w.`warehouse_code`, w.`warehouse_name`,
       CASE WHEN w.`farm_id` IS NULL THEN 1 ELSE 2 END,
       CASE WHEN w.`warehouse_type` = 'SILO' THEN 'SILO' ELSE 'STORE' END,
       w.`farm_id`,
       CASE WHEN w.`warehouse_type` = 'SILO' THEN 'SILO' ELSE 'STORE' END,
       w.`is_active`, w.`status`, w.`deleted_at`
FROM `warehouse_master` w
WHERE NOT EXISTS (SELECT 1 FROM `location_master` l WHERE l.`location_id` = w.`warehouse_id`);--> statement-breakpoint

-- 3. Drop the tables. shed_master and warehouse_master carry their own foreign
--    keys into farm_master, so farm_master goes last.
DROP TABLE `shed_master`;--> statement-breakpoint
DROP TABLE `warehouse_master`;--> statement-breakpoint
DROP TABLE `farm_master`;--> statement-breakpoint

-- 4. Re-point every key at location_master. farm_id, shed_id and warehouse_id
--    stay as denormalised ancestor pointers into the same table.
ALTER TABLE `batch_header` ADD CONSTRAINT `batch_header_shed_id_fk` FOREIGN KEY (`shed_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_output_line` ADD CONSTRAINT `batch_output_line_warehouse_id_location_master_location_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue` ADD CONSTRAINT `goods_issue_warehouse_id_location_master_location_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt` ADD CONSTRAINT `goods_receipt_warehouse_id_location_master_location_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `inventory_ledger_warehouse_id_location_master_location_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `location_master_warehouse_id_location_master_location_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `loc_master_farm_id_fk` FOREIGN KEY (`farm_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `loc_master_shed_id_fk` FOREIGN KEY (`shed_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operational_area_master` ADD CONSTRAINT `fk_op_area_farm` FOREIGN KEY (`farm_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qr_code_master` ADD CONSTRAINT `qr_code_master_warehouse_id_location_master_location_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_adjustment` ADD CONSTRAINT `stock_adjustment_warehouse_id_location_master_location_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_transfer` ADD CONSTRAINT `stock_transfer_from_warehouse_fk` FOREIGN KEY (`from_warehouse_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_transfer` ADD CONSTRAINT `stock_transfer_to_warehouse_fk` FOREIGN KEY (`to_warehouse_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;
