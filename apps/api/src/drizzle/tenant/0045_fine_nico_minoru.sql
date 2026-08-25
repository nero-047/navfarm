CREATE TABLE `batch_transfer` (
	`transfer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`transfer_no` varchar(50) NOT NULL,
	`from_batch_id` varchar(36) NOT NULL,
	`to_batch_id` varchar(36) NOT NULL,
	`transfer_date` date NOT NULL,
	`transfer_type` varchar(20) NOT NULL DEFAULT 'PARTIAL',
	`head_count` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`transfer_value` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`reason` varchar(100),
	`remarks` text,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`posted_at` timestamp,
	`posted_by` varchar(36),
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `batch_transfer_transfer_id` PRIMARY KEY(`transfer_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_transfer_line` (
	`line_id` varchar(36) NOT NULL,
	`transfer_id` varchar(36) NOT NULL,
	`line_no` int NOT NULL,
	`animal_id` varchar(36) NOT NULL,
	`from_location_id` varchar(36),
	`to_location_id` varchar(36),
	`book_value` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`remarks` varchar(500),
	CONSTRAINT `batch_transfer_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
ALTER TABLE `batch_transfer` ADD CONSTRAINT `batch_transfer_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_transfer` ADD CONSTRAINT `batch_transfer_from_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`from_batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_transfer` ADD CONSTRAINT `batch_transfer_to_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`to_batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_transfer_line` ADD CONSTRAINT `batch_transfer_line_transfer_id_batch_transfer_transfer_id_fk` FOREIGN KEY (`transfer_id`) REFERENCES `batch_transfer`(`transfer_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_transfer_line` ADD CONSTRAINT `batch_transfer_line_animal_id_animal_register_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE restrict ON UPDATE no action;