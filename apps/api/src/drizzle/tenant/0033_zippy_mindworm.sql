CREATE TABLE `animal_medication_log` (
	`log_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`animal_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`administered_date` date NOT NULL,
	`dose_qty` decimal(18,4),
	`uom` varchar(20),
	`administered_by` varchar(200),
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `animal_medication_log_log_id` PRIMARY KEY(`log_id`)
);
--> statement-breakpoint
ALTER TABLE `animal_medication_log` ADD CONSTRAINT `animal_medication_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_medication_log` ADD CONSTRAINT `animal_medication_log_animal_id_animal_register_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_medication_log` ADD CONSTRAINT `animal_medication_log_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;