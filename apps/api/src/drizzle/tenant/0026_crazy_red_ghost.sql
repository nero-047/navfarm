CREATE TABLE `stage_master` (
	`stage_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`nob_id` varchar(36) NOT NULL,
	`lob_id` varchar(36) NOT NULL,
	`stage_code` varchar(50) NOT NULL,
	`stage_name` varchar(100) NOT NULL,
	`stage_category` varchar(30) NOT NULL,
	`stage_sequence` int NOT NULL,
	`typical_duration_days` int,
	`min_days_before_move` int NOT NULL DEFAULT 0,
	`transition_trigger` varchar(20) NOT NULL,
	`auto_move_on_day` int,
	`next_stage_id` varchar(36),
	`alt_next_stage_id` varchar(36),
	`alt_trigger_condition` varchar(50),
	`required_kpi_to_pass` json,
	`data_entry_form` varchar(20) NOT NULL DEFAULT 'STANDARD',
	`scheduler_auto_create` boolean NOT NULL DEFAULT true,
	`show_on_animal_card` boolean NOT NULL DEFAULT true,
	`icon_code` varchar(30),
	`stage_description` text,
	`sort_order` int,
	`is_system` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `stage_master_stage_id` PRIMARY KEY(`stage_id`),
	CONSTRAINT `uq_stage_master_tenant_company_lob_code` UNIQUE(`tenant_id`,`company_id`,`lob_id`,`stage_code`)
);
--> statement-breakpoint
ALTER TABLE `batch_header` ADD `stage_id` varchar(36);--> statement-breakpoint
ALTER TABLE `stage_master` ADD CONSTRAINT `stage_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stage_master` ADD CONSTRAINT `stage_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stage_master` ADD CONSTRAINT `stage_master_next_stage_id_fk` FOREIGN KEY (`next_stage_id`) REFERENCES `stage_master`(`stage_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stage_master` ADD CONSTRAINT `stage_master_alt_next_stage_id_fk` FOREIGN KEY (`alt_next_stage_id`) REFERENCES `stage_master`(`stage_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_header` ADD CONSTRAINT `batch_header_stage_id_fk` FOREIGN KEY (`stage_id`) REFERENCES `stage_master`(`stage_id`) ON DELETE set null ON UPDATE no action;