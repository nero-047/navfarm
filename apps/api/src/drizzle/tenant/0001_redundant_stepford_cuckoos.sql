CREATE TABLE `notification_log` (
	`log_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`recipient` varchar(255) NOT NULL,
	`channel` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`error_message` text,
	`sent_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_log_log_id` PRIMARY KEY(`log_id`)
);
--> statement-breakpoint
CREATE TABLE `user_company_assignments` (
	`assign_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`assigned_by` varchar(36) NOT NULL,
	`assigned_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_company_assignments_assign_id` PRIMARY KEY(`assign_id`)
);
--> statement-breakpoint
ALTER TABLE `company_fiscal` ADD `fiscal_end_day` int DEFAULT 31 NOT NULL;--> statement-breakpoint
ALTER TABLE `company_fiscal` ADD `decimal_places` int DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_log` ADD CONSTRAINT `notification_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_company_assignments` ADD CONSTRAINT `user_company_assignments_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master`(`user_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_company_assignments` ADD CONSTRAINT `user_company_assignments_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;