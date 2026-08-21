CREATE TABLE IF NOT EXISTS `operational_area_master` (
	`area_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`farm_id` varchar(36),
	`nob_id` varchar(36) NOT NULL,
	`lob_id` varchar(36) NOT NULL,
	`area_code` varchar(50) NOT NULL,
	`area_name` varchar(150) NOT NULL,
	`description` text,
	`preseed_source` varchar(50) NOT NULL DEFAULT 'TENANT',
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `operational_area_master_area_id` PRIMARY KEY(`area_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_operational_area_assignment` (
	`assignment_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`area_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_operational_area_assignment_assignment_id` PRIMARY KEY(`assignment_id`)
);
--> statement-breakpoint
ALTER TABLE `animal_register` ADD `operational_area_id` varchar(36);
--> statement-breakpoint
ALTER TABLE `batch_header` ADD `operational_area_id` varchar(36);
--> statement-breakpoint
ALTER TABLE `operational_area_master` ADD CONSTRAINT `fk_op_area_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `operational_area_master` ADD CONSTRAINT `fk_op_area_farm` FOREIGN KEY (`farm_id`) REFERENCES `farm_master`(`farm_id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `operational_area_master` ADD CONSTRAINT `fk_op_area_nob` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `operational_area_master` ADD CONSTRAINT `fk_op_area_lob` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `user_operational_area_assignment` ADD CONSTRAINT `fk_uop_user` FOREIGN KEY (`user_id`) REFERENCES `user_master`(`user_id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `user_operational_area_assignment` ADD CONSTRAINT `fk_uop_area` FOREIGN KEY (`area_id`) REFERENCES `operational_area_master`(`area_id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `user_operational_area_assignment` ADD CONSTRAINT `fk_uop_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `fk_anm_op_area` FOREIGN KEY (`operational_area_id`) REFERENCES `operational_area_master`(`area_id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `batch_header` ADD CONSTRAINT `fk_batch_op_area` FOREIGN KEY (`operational_area_id`) REFERENCES `operational_area_master`(`area_id`) ON DELETE set null ON UPDATE no action;