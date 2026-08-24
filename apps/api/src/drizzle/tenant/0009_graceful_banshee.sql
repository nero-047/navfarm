CREATE TABLE `cost_center_master` (
	`cost_center_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`cost_center_code` varchar(50) NOT NULL,
	`cost_center_name` varchar(150) NOT NULL,
	`cost_center_type` varchar(50) NOT NULL,
	`parent_cost_center_id` varchar(36),
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `cost_center_master_cost_center_id` PRIMARY KEY(`cost_center_id`)
);
--> statement-breakpoint
ALTER TABLE `cost_center_master` ADD CONSTRAINT `cost_center_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cost_center_master` ADD CONSTRAINT `cost_center_parent_id_fk` FOREIGN KEY (`parent_cost_center_id`) REFERENCES `cost_center_master`(`cost_center_id`) ON DELETE restrict ON UPDATE no action;