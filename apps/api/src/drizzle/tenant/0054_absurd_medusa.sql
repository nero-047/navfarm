CREATE TABLE `item_type_master` (
	`item_type_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`type_code` varchar(30) NOT NULL,
	`type_name` varchar(100) NOT NULL,
	`description` text,
	`is_system` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `item_type_master_item_type_id` PRIMARY KEY(`item_type_id`),
	CONSTRAINT `uq_item_type_master_tenant_company_code` UNIQUE(`tenant_id`,`company_id`,`type_code`)
);
