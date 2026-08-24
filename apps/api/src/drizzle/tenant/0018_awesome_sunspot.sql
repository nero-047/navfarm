CREATE TABLE `batch_bio_asset_state` (
	`state_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`stage` varchar(20) NOT NULL DEFAULT 'PREMATURE',
	`current_quantity` decimal(18,4) NOT NULL,
	`nca_book_value` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`residual_value_per_unit` decimal(18,6),
	`productive_life_months` int,
	`monthly_amortization_rate` decimal(18,6),
	`matured_at` date,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `batch_bio_asset_state_state_id` PRIMARY KEY(`state_id`),
	CONSTRAINT `batch_bio_asset_state_batch_id_unique` UNIQUE(`batch_id`)
);
--> statement-breakpoint
ALTER TABLE `bio_asset_ledger` ADD `batch_id` varchar(36);--> statement-breakpoint
ALTER TABLE `batch_bio_asset_state` ADD CONSTRAINT `batch_bio_asset_state_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bio_asset_ledger` ADD CONSTRAINT `bio_asset_ledger_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE restrict ON UPDATE no action;