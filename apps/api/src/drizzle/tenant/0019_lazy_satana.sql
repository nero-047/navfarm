CREATE TABLE `notification_alert_log` (
	`alert_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`lob_id` varchar(36),
	`batch_id` varchar(36),
	`spl_id` varchar(36),
	`transaction_id` varchar(36),
	`alert_type` varchar(40) NOT NULL DEFAULT 'KPI_DEVIATION',
	`severity` varchar(10) NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`parameter_name` varchar(200),
	`kpi_mode` varchar(10),
	`expected_value` decimal(18,4),
	`actual_value` decimal(18,4),
	`deviation_amount` decimal(18,4),
	`deviation_pct` decimal(8,2),
	`kpi_min` decimal(18,4),
	`kpi_max` decimal(18,4),
	`is_read` boolean NOT NULL DEFAULT false,
	`read_by` varchar(36),
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notification_alert_log_alert_id` PRIMARY KEY(`alert_id`)
);
--> statement-breakpoint
CREATE TABLE `parameter_master` (
	`parameter_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`nob_id` varchar(36),
	`lob_id` varchar(36),
	`parameter_code` varchar(50) NOT NULL,
	`parameter_name` varchar(200) NOT NULL,
	`parameter_type` varchar(20) NOT NULL,
	`item_id` varchar(36),
	`resource_id` varchar(36),
	`default_uom` varchar(20),
	`qty_method` varchar(20) NOT NULL,
	`default_qty_per_unit` decimal(18,8),
	`default_qty_per_batch` decimal(18,4),
	`description` text,
	`is_mandatory` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `parameter_master_parameter_id` PRIMARY KEY(`parameter_id`)
);
--> statement-breakpoint
CREATE TABLE `scheduler_master` (
	`scheduler_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`nob_id` varchar(36) NOT NULL,
	`lob_id` varchar(36) NOT NULL,
	`scheduler_code` varchar(50) NOT NULL,
	`scheduler_name` varchar(200) NOT NULL,
	`duration_value` int NOT NULL,
	`duration_unit` varchar(10) NOT NULL,
	`breed_id` varchar(36),
	`is_locked` boolean NOT NULL DEFAULT false,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `scheduler_master_scheduler_id` PRIMARY KEY(`scheduler_id`)
);
--> statement-breakpoint
CREATE TABLE `scheduler_parameter_line` (
	`spl_id` varchar(36) NOT NULL,
	`scheduler_id` varchar(36) NOT NULL,
	`parameter_id` varchar(36) NOT NULL,
	`period_no` int NOT NULL,
	`period_from` int NOT NULL,
	`period_to` int NOT NULL,
	`period_label` varchar(50),
	`expected_qty_override` decimal(18,8),
	`uom_override` varchar(20),
	`kpi_enabled` boolean NOT NULL DEFAULT true,
	`kpi_mode` varchar(10),
	`kpi_min_pct` decimal(6,2),
	`kpi_max_pct` decimal(6,2),
	`kpi_min_value` decimal(18,4),
	`kpi_max_value` decimal(18,4),
	`kpi_target_value` decimal(18,4),
	`critical_threshold_pct` decimal(6,2),
	`notify_in_app` boolean NOT NULL DEFAULT true,
	`notify_push` boolean NOT NULL DEFAULT false,
	`notify_email` boolean NOT NULL DEFAULT false,
	`sort_order` int,
	`notes` text,
	CONSTRAINT `scheduler_parameter_line_spl_id` PRIMARY KEY(`spl_id`)
);
--> statement-breakpoint
ALTER TABLE `batch_header` ADD `scheduler_id` varchar(36);--> statement-breakpoint
ALTER TABLE `notification_alert_log` ADD CONSTRAINT `notification_alert_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_alert_log` ADD CONSTRAINT `notification_alert_log_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_alert_log` ADD CONSTRAINT `notification_alert_log_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_alert_log` ADD CONSTRAINT `nal_spl_id_fk` FOREIGN KEY (`spl_id`) REFERENCES `scheduler_parameter_line`(`spl_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_alert_log` ADD CONSTRAINT `nal_transaction_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `batch_transaction`(`transaction_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parameter_master` ADD CONSTRAINT `parameter_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parameter_master` ADD CONSTRAINT `parameter_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parameter_master` ADD CONSTRAINT `parameter_master_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parameter_master` ADD CONSTRAINT `parameter_master_resource_id_resource_master_resource_id_fk` FOREIGN KEY (`resource_id`) REFERENCES `resource_master`(`resource_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD CONSTRAINT `scheduler_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD CONSTRAINT `scheduler_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduler_master` ADD CONSTRAINT `scheduler_master_breed_id_breed_master_breed_id_fk` FOREIGN KEY (`breed_id`) REFERENCES `breed_master`(`breed_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD CONSTRAINT `spl_scheduler_id_fk` FOREIGN KEY (`scheduler_id`) REFERENCES `scheduler_master`(`scheduler_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD CONSTRAINT `spl_parameter_id_fk` FOREIGN KEY (`parameter_id`) REFERENCES `parameter_master`(`parameter_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_header` ADD CONSTRAINT `batch_header_scheduler_id_scheduler_master_scheduler_id_fk` FOREIGN KEY (`scheduler_id`) REFERENCES `scheduler_master`(`scheduler_id`) ON DELETE restrict ON UPDATE no action;