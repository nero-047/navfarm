CREATE TABLE `medicine_master` (
	`medicine_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`composition` varchar(255),
	`dosage_guideline` text,
	`withdrawal_period_days` int,
	`route_of_administration` varchar(50),
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `medicine_master_medicine_id` PRIMARY KEY(`medicine_id`)
);
--> statement-breakpoint
ALTER TABLE `medicine_master` ADD CONSTRAINT `medicine_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `medicine_master` ADD CONSTRAINT `medicine_master_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE cascade ON UPDATE no action;