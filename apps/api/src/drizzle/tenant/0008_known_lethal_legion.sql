CREATE TABLE `gl_mapping_master` (
	`mapping_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`item_category_id` varchar(36),
	`transaction_type` varchar(50) NOT NULL,
	`debit_gl_account_id` varchar(36),
	`credit_gl_account_id` varchar(36),
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `gl_mapping_master_mapping_id` PRIMARY KEY(`mapping_id`)
);
--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD CONSTRAINT `gl_map_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD CONSTRAINT `gl_map_category_id_fk` FOREIGN KEY (`item_category_id`) REFERENCES `item_category_master`(`category_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD CONSTRAINT `gl_map_debit_gl_id_fk` FOREIGN KEY (`debit_gl_account_id`) REFERENCES `gl_account_master`(`gl_account_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD CONSTRAINT `gl_map_credit_gl_id_fk` FOREIGN KEY (`credit_gl_account_id`) REFERENCES `gl_account_master`(`gl_account_id`) ON DELETE restrict ON UPDATE no action;