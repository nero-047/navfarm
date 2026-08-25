CREATE TABLE `milk_production_log` (
	`log_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`operational_area_id` varchar(36),
	`batch_id` varchar(36) NOT NULL,
	`animal_id` varchar(36),
	`log_date` date NOT NULL,
	`session` varchar(20) NOT NULL DEFAULT 'MORNING',
	`quantity_litres` decimal(18,3) NOT NULL,
	`fat_pct` decimal(6,3),
	`snf_pct` decimal(6,3),
	`scc_count` int,
	`bmc_temperature_c` decimal(6,2),
	`remarks` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `milk_production_log_log_id` PRIMARY KEY(`log_id`),
	CONSTRAINT `uq_milk_log_batch_date_session_animal` UNIQUE(`batch_id`,`log_date`,`session`,`animal_id`)
);
--> statement-breakpoint
ALTER TABLE `milk_production_log` ADD CONSTRAINT `milk_production_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `milk_production_log` ADD CONSTRAINT `milk_production_log_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `milk_production_log` ADD CONSTRAINT `milk_production_log_animal_id_animal_register_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE set null ON UPDATE no action;