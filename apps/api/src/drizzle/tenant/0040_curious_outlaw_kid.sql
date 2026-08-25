CREATE TABLE `animal_observation_log` (
	`log_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`animal_id` varchar(36) NOT NULL,
	`batch_id` varchar(36),
	`lot_id` varchar(36),
	`observation_date` date NOT NULL,
	`weight_kg` decimal(10,3),
	`bcs_score` decimal(3,1),
	`note` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `animal_observation_log_log_id` PRIMARY KEY(`log_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_daily_entry_draft` (
	`draft_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`entry_date` varchar(10) NOT NULL,
	`payload` json NOT NULL,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batch_daily_entry_draft_draft_id` PRIMARY KEY(`draft_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_location_lot` (
	`lot_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`lot_no` varchar(50) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`stage_id` varchar(36),
	`opening_quantity` decimal(18,4) NOT NULL,
	`current_quantity` decimal(18,4) NOT NULL,
	`closing_quantity` decimal(18,4),
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`merged_into_lot_id` varchar(36),
	`remarks` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batch_location_lot_lot_id` PRIMARY KEY(`lot_id`),
	CONSTRAINT `uq_batch_location_lot_tenant_company_no` UNIQUE(`tenant_id`,`company_id`,`lot_no`)
);
--> statement-breakpoint
CREATE TABLE `scheduler_line_custom_days` (
	`custom_day_id` varchar(36) NOT NULL,
	`spl_id` varchar(36) NOT NULL,
	`day_number` int NOT NULL,
	`day_label` varchar(100),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduler_line_custom_days_custom_day_id` PRIMARY KEY(`custom_day_id`)
);
--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` MODIFY COLUMN `occurrence` varchar(20);--> statement-breakpoint
ALTER TABLE `animal_register` ADD `breeding_tier` varchar(10);--> statement-breakpoint
ALTER TABLE `animal_register` ADD `current_lot_id` varchar(36);--> statement-breakpoint
ALTER TABLE `batch_output_line` ADD `lot_id` varchar(36);--> statement-breakpoint
ALTER TABLE `batch_stage_log` ADD `lot_id` varchar(36);--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD `lot_id` varchar(36);--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD `animal_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `batch_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `stage_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `stage_code` varchar(50);--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `stage_name` varchar(100);--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `scheduler_status` varchar(20) DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `location_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `data_entry_level` varchar(10) DEFAULT 'SHED';--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `effective_from` varchar(50);--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `effective_to` varchar(50);--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `actual_end_date` varchar(50);--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `animal_count` decimal(14,4);--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD `auto_generated` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `line_seq` int;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `line_type` varchar(20);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `parameter_name` varchar(200);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `stage_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `start_day` int;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `end_day` int;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `day_of_week` int;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `custom_days` json;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `is_mandatory` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `source` varchar(20) DEFAULT 'AUTO';--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `lifecycle_ref_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `item_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `item_description` varchar(200);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `uom` varchar(20);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `standard_qty` decimal(18,6);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `qty_basis` varchar(20) DEFAULT 'PER_HEAD';--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `allow_qty_edit` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `lot_required` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `withdrawal_days` int;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `creates_inventory` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `output_lot_auto` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `output_basis` varchar(20) DEFAULT 'PER_BATCH';--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `kpi_metric` varchar(50);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `kpi_uom` varchar(20);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `std_value` decimal(18,4);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `lower_alert_limit` decimal(18,4);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `upper_alert_limit` decimal(18,4);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `alert_severity` varchar(10) DEFAULT 'WARNING';--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `capture_per` varchar(20) DEFAULT 'AVERAGE';--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `overhead_category` varchar(30);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `gl_account` varchar(20);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `estimated_cost` decimal(18,4);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `resource_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `resource_name` varchar(200);--> statement-breakpoint
ALTER TABLE `animal_observation_log` ADD CONSTRAINT `animal_observation_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_observation_log` ADD CONSTRAINT `animal_observation_log_animal_id_animal_register_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_observation_log` ADD CONSTRAINT `animal_observation_log_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_observation_log` ADD CONSTRAINT `animal_observation_log_lot_id_batch_location_lot_lot_id_fk` FOREIGN KEY (`lot_id`) REFERENCES `batch_location_lot`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_daily_entry_draft` ADD CONSTRAINT `batch_daily_entry_draft_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_location_lot` ADD CONSTRAINT `batch_location_lot_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_location_lot` ADD CONSTRAINT `batch_location_lot_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_location_lot` ADD CONSTRAINT `batch_location_lot_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_location_lot` ADD CONSTRAINT `batch_location_lot_stage_id_stage_master_stage_id_fk` FOREIGN KEY (`stage_id`) REFERENCES `stage_master`(`stage_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduler_line_custom_days` ADD CONSTRAINT `slcd_spl_id_fk` FOREIGN KEY (`spl_id`) REFERENCES `scheduler_parameter_line`(`spl_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_current_lot_id_batch_location_lot_lot_id_fk` FOREIGN KEY (`current_lot_id`) REFERENCES `batch_location_lot`(`lot_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_output_line` ADD CONSTRAINT `batch_output_line_lot_id_batch_location_lot_lot_id_fk` FOREIGN KEY (`lot_id`) REFERENCES `batch_location_lot`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_stage_log` ADD CONSTRAINT `batch_stage_log_lot_id_batch_location_lot_lot_id_fk` FOREIGN KEY (`lot_id`) REFERENCES `batch_location_lot`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD CONSTRAINT `batch_transaction_lot_id_batch_location_lot_lot_id_fk` FOREIGN KEY (`lot_id`) REFERENCES `batch_location_lot`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD CONSTRAINT `batch_transaction_animal_id_animal_register_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE restrict ON UPDATE no action;