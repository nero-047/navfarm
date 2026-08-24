CREATE TABLE `disease_master` (
	`disease_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`disease_code` varchar(50) NOT NULL,
	`disease_name` varchar(150) NOT NULL,
	`scientific_name` varchar(150),
	`symptoms` text,
	`treatment_guideline` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `disease_master_disease_id` PRIMARY KEY(`disease_id`)
);
--> statement-breakpoint
ALTER TABLE `disease_master` ADD CONSTRAINT `disease_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;