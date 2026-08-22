CREATE TABLE `batch_attachment` (
	`attachment_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`log_date` date NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_url` varchar(500) NOT NULL,
	`mime_type` varchar(100),
	`attachment_type` varchar(20) NOT NULL DEFAULT 'IMAGE',
	`uploaded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batch_attachment_attachment_id` PRIMARY KEY(`attachment_id`)
);
--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD `persons` int;--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD `hours` decimal(8,2);--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD `adg` decimal(10,4);--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD `bcs_score` decimal(4,2);--> statement-breakpoint
ALTER TABLE `batch_attachment` ADD CONSTRAINT `batch_attachment_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;