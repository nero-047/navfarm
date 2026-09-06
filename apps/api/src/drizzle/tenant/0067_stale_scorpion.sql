CREATE TABLE `reason_master` (
	`reason_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`reason_code` varchar(50) NOT NULL,
	`reason_name` varchar(150) NOT NULL,
	`category` varchar(20) NOT NULL,
	`applicable_stages` json,
	`mandatory_weight` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `reason_master_reason_id` PRIMARY KEY(`reason_id`),
	CONSTRAINT `uq_reason_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`reason_code`)
);
--> statement-breakpoint
ALTER TABLE `reason_master` ADD CONSTRAINT `reason_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;
