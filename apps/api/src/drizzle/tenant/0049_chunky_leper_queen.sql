CREATE TABLE `batch_mortality_detail` (
	`detail_id` varchar(36) NOT NULL,
	`transaction_id` varchar(36) NOT NULL,
	`location_id` varchar(36),
	`cause_of_death` varchar(200),
	`post_mortem_notes` text,
	`disposal_method` varchar(100),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batch_mortality_detail_detail_id` PRIMARY KEY(`detail_id`),
	CONSTRAINT `batch_mortality_detail_transaction_id_unique` UNIQUE(`transaction_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_treatment_detail` (
	`detail_id` varchar(36) NOT NULL,
	`transaction_id` varchar(36) NOT NULL,
	`diagnosis` varchar(255),
	`route` varchar(50),
	`withdrawal_days` int,
	`veterinarian` varchar(150),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batch_treatment_detail_detail_id` PRIMARY KEY(`detail_id`),
	CONSTRAINT `batch_treatment_detail_transaction_id_unique` UNIQUE(`transaction_id`)
);
--> statement-breakpoint
ALTER TABLE `batch_mortality_detail` ADD CONSTRAINT `bmd_transaction_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `batch_transaction`(`transaction_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_mortality_detail` ADD CONSTRAINT `bmd_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_treatment_detail` ADD CONSTRAINT `btd_transaction_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `batch_transaction`(`transaction_id`) ON DELETE cascade ON UPDATE no action;