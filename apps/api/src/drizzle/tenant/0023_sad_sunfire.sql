CREATE TABLE `batch_stage_log` (
	`log_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`from_stage_code` varchar(50),
	`to_stage_code` varchar(50) NOT NULL,
	`from_location_id` varchar(36),
	`to_location_id` varchar(36),
	`transferred_at` timestamp NOT NULL DEFAULT (now()),
	`transferred_by` varchar(36),
	`remarks` text,
	CONSTRAINT `batch_stage_log_log_id` PRIMARY KEY(`log_id`)
);
--> statement-breakpoint
ALTER TABLE `batch_header` ADD `current_stage_code` varchar(50);--> statement-breakpoint
ALTER TABLE `batch_header` ADD `sub_location_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `stage_code` varchar(50);--> statement-breakpoint
ALTER TABLE `batch_stage_log` ADD CONSTRAINT `batch_stage_log_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;