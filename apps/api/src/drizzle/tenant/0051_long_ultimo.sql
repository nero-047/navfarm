CREATE TABLE `farm_record` (
	`record_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`record_date` date NOT NULL,
	`record_type` varchar(20) NOT NULL,
	`scope` varchar(10) NOT NULL,
	`stage_code` varchar(50),
	`item_id` varchar(36),
	`resource_id` varchar(36),
	`quantity` decimal(18,4),
	`uom` varchar(20),
	`rate` decimal(18,6),
	`amount` decimal(18,4),
	`remarks` text,
	`version` int NOT NULL DEFAULT 1,
	`status` varchar(12) NOT NULL DEFAULT 'ACTIVE',
	`supersedes_id` varchar(36),
	`superseded_by_id` varchar(36),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_by` varchar(36),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `farm_record_record_id` PRIMARY KEY(`record_id`)
);
--> statement-breakpoint
CREATE TABLE `farm_record_animal` (
	`line_id` varchar(36) NOT NULL,
	`record_id` varchar(36) NOT NULL,
	`animal_id` varchar(36) NOT NULL,
	CONSTRAINT `farm_record_animal_line_id` PRIMARY KEY(`line_id`),
	CONSTRAINT `fra_record_animal_uq` UNIQUE(`record_id`,`animal_id`)
);
--> statement-breakpoint
ALTER TABLE `farm_record` ADD CONSTRAINT `fr_company_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farm_record` ADD CONSTRAINT `fr_batch_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farm_record` ADD CONSTRAINT `fr_item_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farm_record` ADD CONSTRAINT `fr_resource_fk` FOREIGN KEY (`resource_id`) REFERENCES `resource_master`(`resource_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farm_record_animal` ADD CONSTRAINT `fra_record_fk` FOREIGN KEY (`record_id`) REFERENCES `farm_record`(`record_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farm_record_animal` ADD CONSTRAINT `fra_animal_fk` FOREIGN KEY (`animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE restrict ON UPDATE no action;