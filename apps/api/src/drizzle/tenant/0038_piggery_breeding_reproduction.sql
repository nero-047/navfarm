ALTER TABLE `location_master` ADD `last_cleaned_date` date;--> statement-breakpoint
ALTER TABLE `location_master` ADD `last_disinfected_date` date;--> statement-breakpoint

CREATE TABLE `breeding_record` (
	`breeding_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`sow_animal_id` varchar(36) NOT NULL,
	`batch_id` varchar(36),
	`mating_type` varchar(20) NOT NULL,
	`boar_animal_id` varchar(36),
	`semen_lot_id` varchar(36),
	`semen_dose_qty` decimal(6,2) DEFAULT '1.00',
	`mating_date` date NOT NULL,
	`second_mating_date` date,
	`expected_farrowing_date` date NOT NULL,
	`preg_check_date` date,
	`preg_check_method` varchar(20) DEFAULT 'ULTRASOUND',
	`pregnancy_confirmed` boolean,
	`conception_result` varchar(20) NOT NULL DEFAULT 'PENDING',
	`parity_number` int NOT NULL,
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `breeding_record_breeding_id` PRIMARY KEY(`breeding_id`)
);--> statement-breakpoint

CREATE TABLE `farrowing_record` (
	`farrow_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`sow_animal_id` varchar(36) NOT NULL,
	`breeding_id` varchar(36),
	`batch_id` varchar(36),
	`farrowing_date` date NOT NULL,
	`piglets_born_total` int NOT NULL DEFAULT 0,
	`piglets_born_live` int NOT NULL DEFAULT 0,
	`piglets_stillborn` int NOT NULL DEFAULT 0,
	`piglets_mummified` int NOT NULL DEFAULT 0,
	`avg_birth_weight_kg` decimal(6,3),
	`total_litter_weight_kg` decimal(8,3),
	`farrowing_status` varchar(20) NOT NULL DEFAULT 'NORMAL',
	`foster_received` int NOT NULL DEFAULT 0,
	`fostered_out` int NOT NULL DEFAULT 0,
	`weaning_date` date,
	`piglets_weaned` int NOT NULL DEFAULT 0,
	`avg_weaning_weight_kg` decimal(6,3),
	`cost_per_piglet` decimal(18,4),
	`parity_number` int NOT NULL,
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `farrowing_record_farrow_id` PRIMARY KEY(`farrow_id`)
);--> statement-breakpoint

CREATE TABLE `semen_batch` (
	`semen_batch_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`boar_animal_id` varchar(36) NOT NULL,
	`boar_batch_id` varchar(36),
	`collection_date` date NOT NULL,
	`period_from` date,
	`period_to` date,
	`amortisation_period` decimal(18,4) DEFAULT '0.0000',
	`feed_cost_period` decimal(18,4) DEFAULT '0.0000',
	`drug_cost_period` decimal(18,4) DEFAULT '0.0000',
	`overhead_cost_period` decimal(18,4) DEFAULT '0.0000',
	`running_cost_period` decimal(18,4) DEFAULT '0.0000',
	`doses_collected` decimal(10,2) NOT NULL,
	`unit_cost_per_dose` decimal(18,6) DEFAULT '0.000000',
	`doses_used_internal` decimal(10,2) DEFAULT '0.00',
	`doses_sold` decimal(10,2) DEFAULT '0.00',
	`output_item_id` varchar(36),
	`inventory_posted` boolean NOT NULL DEFAULT false,
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `semen_batch_semen_batch_id` PRIMARY KEY(`semen_batch_id`)
);--> statement-breakpoint

ALTER TABLE `breeding_record` ADD CONSTRAINT `breeding_record_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breeding_record` ADD CONSTRAINT `breeding_record_sow_animal_id_animal_register_animal_id_fk` FOREIGN KEY (`sow_animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breeding_record` ADD CONSTRAINT `breeding_record_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breeding_record` ADD CONSTRAINT `breeding_record_boar_animal_id_animal_register_animal_id_fk` FOREIGN KEY (`boar_animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint

ALTER TABLE `farrowing_record` ADD CONSTRAINT `farrowing_record_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farrowing_record` ADD CONSTRAINT `farrowing_record_sow_animal_id_animal_register_animal_id_fk` FOREIGN KEY (`sow_animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farrowing_record` ADD CONSTRAINT `farrowing_record_breeding_id_breeding_record_breeding_id_fk` FOREIGN KEY (`breeding_id`) REFERENCES `breeding_record`(`breeding_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farrowing_record` ADD CONSTRAINT `farrowing_record_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint

ALTER TABLE `semen_batch` ADD CONSTRAINT `semen_batch_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `semen_batch` ADD CONSTRAINT `semen_batch_boar_animal_id_animal_register_animal_id_fk` FOREIGN KEY (`boar_animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `semen_batch` ADD CONSTRAINT `semen_batch_boar_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`boar_batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `semen_batch` ADD CONSTRAINT `semen_batch_output_item_id_item_master_item_id_fk` FOREIGN KEY (`output_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE set null ON UPDATE no action;
