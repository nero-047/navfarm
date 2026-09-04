CREATE TABLE `location_type_master` (
	`location_type_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`type_code` varchar(30) NOT NULL,
	`type_name` varchar(100) NOT NULL,
	`code_prefix` varchar(20) NOT NULL,
	`allowed_parent_types` json NOT NULL,
	`is_system` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `location_type_master_location_type_id` PRIMARY KEY(`location_type_id`),
	CONSTRAINT `uq_location_type_tenant_company_code` UNIQUE(`tenant_id`,`company_id`,`type_code`)
);--> statement-breakpoint

-- Core types from the client Location Master template. They are tenant-wide;
-- a company may later add an override with its own prefix.
INSERT IGNORE INTO `location_type_master`
  (`location_type_id`, `tenant_id`, `company_id`, `type_code`, `type_name`, `code_prefix`, `allowed_parent_types`, `is_system`)
SELECT UUID(), tenant_id, NULL, 'FARM', 'Farm', 'FARM', JSON_ARRAY(), true FROM (SELECT DISTINCT tenant_id FROM company_master) tenants;--> statement-breakpoint
INSERT IGNORE INTO `location_type_master` (`location_type_id`, `tenant_id`, `company_id`, `type_code`, `type_name`, `code_prefix`, `allowed_parent_types`, `is_system`)
SELECT UUID(), tenant_id, NULL, 'SHED', 'Shed / House', 'SHED', JSON_ARRAY('FARM'), true FROM (SELECT DISTINCT tenant_id FROM company_master) tenants;--> statement-breakpoint
INSERT IGNORE INTO `location_type_master` (`location_type_id`, `tenant_id`, `company_id`, `type_code`, `type_name`, `code_prefix`, `allowed_parent_types`, `is_system`)
SELECT UUID(), tenant_id, NULL, 'PEN', 'Pen', 'PEN', JSON_ARRAY('FARM','SHED'), true FROM (SELECT DISTINCT tenant_id FROM company_master) tenants;--> statement-breakpoint
INSERT IGNORE INTO `location_type_master` (`location_type_id`, `tenant_id`, `company_id`, `type_code`, `type_name`, `code_prefix`, `allowed_parent_types`, `is_system`)
SELECT UUID(), tenant_id, NULL, 'CAGE', 'Cage', 'CAGE', JSON_ARRAY('FARM','SHED'), true FROM (SELECT DISTINCT tenant_id FROM company_master) tenants;--> statement-breakpoint
INSERT IGNORE INTO `location_type_master` (`location_type_id`, `tenant_id`, `company_id`, `type_code`, `type_name`, `code_prefix`, `allowed_parent_types`, `is_system`)
SELECT UUID(), tenant_id, NULL, 'STORE', 'Store', 'STORE', JSON_ARRAY('FARM'), true FROM (SELECT DISTINCT tenant_id FROM company_master) tenants;--> statement-breakpoint
INSERT IGNORE INTO `location_type_master` (`location_type_id`, `tenant_id`, `company_id`, `type_code`, `type_name`, `code_prefix`, `allowed_parent_types`, `is_system`)
SELECT UUID(), tenant_id, NULL, 'QUARANTINE', 'Quarantine', 'QUAR', JSON_ARRAY('FARM','SHED'), true FROM (SELECT DISTINCT tenant_id FROM company_master) tenants;--> statement-breakpoint
INSERT IGNORE INTO `location_type_master` (`location_type_id`, `tenant_id`, `company_id`, `type_code`, `type_name`, `code_prefix`, `allowed_parent_types`, `is_system`)
SELECT UUID(), tenant_id, NULL, 'SILO', 'Silo', 'SILO', JSON_ARRAY('FARM'), true FROM (SELECT DISTINCT tenant_id FROM company_master) tenants;--> statement-breakpoint

-- Bring legacy physical records into the canonical Location hierarchy while
-- keeping their original UUIDs, so existing batch/inventory references remain
-- valid during the compatibility period.
INSERT IGNORE INTO `location_master`
  (`location_id`, `tenant_id`, `company_id`, `nob_id`, `lob_id`, `farm_id`, `location_code`, `location_name`, `location_address`, `location_level`, `location_type`, `parent_location_id`, `max_capacity`, `capacity_uom`, `is_active`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`)
SELECT farm_id, tenant_id, company_id, nob_id, lob_id, farm_id, farm_code, farm_name, address_line1, 1, 'FARM', NULL, capacity, 'HEAD', is_active, status, created_by, updated_by, created_at, updated_at, deleted_at
FROM `farm_master`;--> statement-breakpoint

INSERT IGNORE INTO `location_master`
  (`location_id`, `tenant_id`, `company_id`, `nob_id`, `lob_id`, `farm_id`, `shed_id`, `location_code`, `location_name`, `location_address`, `location_level`, `location_type`, `parent_location_id`, `max_capacity`, `capacity_uom`, `is_active`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`)
SELECT s.shed_id, s.tenant_id, s.company_id, s.nob_id, s.lob_id, s.farm_id, s.shed_id, s.shed_code, s.shed_name, f.address_line1, 2, 'SHED', s.farm_id, s.capacity, 'HEAD', s.is_active, s.status, s.created_by, s.updated_by, s.created_at, s.updated_at, s.deleted_at
FROM `shed_master` s LEFT JOIN `farm_master` f ON f.farm_id = s.farm_id;--> statement-breakpoint

INSERT IGNORE INTO `location_master`
  (`location_id`, `tenant_id`, `company_id`, `farm_id`, `warehouse_id`, `location_code`, `location_name`, `location_address`, `location_level`, `location_type`, `parent_location_id`, `storage_type`, `is_active`, `status`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`)
SELECT w.warehouse_id, w.tenant_id, w.company_id, w.farm_id, w.warehouse_id, w.warehouse_code, w.warehouse_name, f.address_line1, IF(w.farm_id IS NULL, 1, 2), IF(w.warehouse_type = 'SILO', 'SILO', 'STORE'), w.farm_id, IF(w.warehouse_type = 'SILO', 'SILO', 'STORE'), w.is_active, w.status, w.created_by, w.updated_by, w.created_at, w.updated_at, w.deleted_at
FROM `warehouse_master` w LEFT JOIN `farm_master` f ON f.farm_id = w.farm_id;
