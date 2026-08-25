CREATE TABLE `approval_request` (
	`request_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`operational_area_id` varchar(36),
	`doc_type` varchar(40) NOT NULL,
	`doc_no` varchar(50) NOT NULL,
	`title` varchar(200) NOT NULL,
	`requested_by` varchar(36),
	`requestor_label` varchar(150),
	`requestor_role` varchar(60),
	`location_label` varchar(200),
	`batch_id` varchar(36),
	`urgency` varchar(10) NOT NULL DEFAULT 'MEDIUM',
	`item_or_stage` varchar(200),
	`requested_qty` varchar(100),
	`uom` varchar(20),
	`cost_impact` decimal(18,4),
	`justification` text,
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`submitted_at` timestamp NOT NULL DEFAULT (now()),
	`decided_at` timestamp,
	`decided_by` varchar(36),
	`decider_label` varchar(150),
	`rejection_reason` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `approval_request_request_id` PRIMARY KEY(`request_id`)
);
--> statement-breakpoint
CREATE TABLE `operational_area_settings` (
	`setting_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`area_id` varchar(36) NOT NULL,
	`costing_method` varchar(20) NOT NULL DEFAULT 'STANDARD',
	`default_feed_uom` varchar(20) NOT NULL DEFAULT 'KG',
	`mortality_threshold_pct` decimal(6,3),
	`temp_threshold_min` decimal(6,2),
	`temp_threshold_max` decimal(6,2),
	`auto_approve_ration_under_qty` decimal(18,4),
	`lob_config` json,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operational_area_settings_setting_id` PRIMARY KEY(`setting_id`),
	CONSTRAINT `operational_area_settings_area_id_unique` UNIQUE(`area_id`)
);
--> statement-breakpoint
ALTER TABLE `approval_request` ADD CONSTRAINT `approval_request_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_request` ADD CONSTRAINT `approval_request_requested_by_user_master_user_id_fk` FOREIGN KEY (`requested_by`) REFERENCES `user_master`(`user_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_request` ADD CONSTRAINT `approval_request_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_request` ADD CONSTRAINT `approval_request_decided_by_user_master_user_id_fk` FOREIGN KEY (`decided_by`) REFERENCES `user_master`(`user_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approval_request` ADD CONSTRAINT `approval_request_area_fk` FOREIGN KEY (`operational_area_id`) REFERENCES `operational_area_master`(`area_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operational_area_settings` ADD CONSTRAINT `oa_settings_company_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operational_area_settings` ADD CONSTRAINT `oa_settings_area_fk` FOREIGN KEY (`area_id`) REFERENCES `operational_area_master`(`area_id`) ON DELETE cascade ON UPDATE no action;