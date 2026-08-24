CREATE TABLE `batch_cost_variance` (
	`variance_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`variance_type` varchar(20) NOT NULL,
	`item_id` varchar(36),
	`std_value` decimal(18,6) NOT NULL,
	`actual_value` decimal(18,6) NOT NULL,
	`variance_amount` decimal(18,4) NOT NULL,
	`is_favorable` boolean NOT NULL,
	`dr_gl_account_id` varchar(36),
	`cr_gl_account_id` varchar(36),
	`journal_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `batch_cost_variance_variance_id` PRIMARY KEY(`variance_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_standard` (
	`standard_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`std_output_quantity` decimal(18,4),
	`std_output_cost_per_unit` decimal(18,6),
	`std_overhead_rate_per_unit` decimal(18,6),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `batch_standard_standard_id` PRIMARY KEY(`standard_id`),
	CONSTRAINT `batch_standard_batch_id_unique` UNIQUE(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_standard_consumption_line` (
	`line_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`std_qty_per_unit_per_day` decimal(18,8) NOT NULL,
	`std_rate` decimal(18,6),
	CONSTRAINT `batch_standard_consumption_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
ALTER TABLE `batch_cost_variance` ADD CONSTRAINT `batch_cost_variance_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_cost_variance` ADD CONSTRAINT `batch_cost_variance_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_cost_variance` ADD CONSTRAINT `batch_cost_variance_journal_id_journal_header_journal_id_fk` FOREIGN KEY (`journal_id`) REFERENCES `journal_header`(`journal_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_cost_variance` ADD CONSTRAINT `bcv_dr_gl_fk` FOREIGN KEY (`dr_gl_account_id`) REFERENCES `gl_account_master`(`gl_account_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_cost_variance` ADD CONSTRAINT `bcv_cr_gl_fk` FOREIGN KEY (`cr_gl_account_id`) REFERENCES `gl_account_master`(`gl_account_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_standard` ADD CONSTRAINT `batch_standard_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_standard_consumption_line` ADD CONSTRAINT `bscl_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_standard_consumption_line` ADD CONSTRAINT `bscl_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;