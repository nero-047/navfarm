CREATE TABLE `gl_account_master` (
	`gl_account_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`account_code` varchar(50) NOT NULL,
	`account_name` varchar(150) NOT NULL,
	`account_type` varchar(50) NOT NULL,
	`parent_account_id` varchar(36),
	`is_sub_account` boolean NOT NULL DEFAULT false,
	`is_reconciliation` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `gl_account_master_gl_account_id` PRIMARY KEY(`gl_account_id`)
);
--> statement-breakpoint
ALTER TABLE `gl_account_master` ADD CONSTRAINT `gl_account_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gl_account_master` ADD CONSTRAINT `gl_account_parent_id_fk` FOREIGN KEY (`parent_account_id`) REFERENCES `gl_account_master`(`gl_account_id`) ON DELETE restrict ON UPDATE no action;