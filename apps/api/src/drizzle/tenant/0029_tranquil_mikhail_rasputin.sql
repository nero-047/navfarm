CREATE TABLE `animal_register` (
	`animal_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`nob_id` varchar(36) NOT NULL,
	`lob_id` varchar(36) NOT NULL,
	`animal_code` varchar(30) NOT NULL,
	`animal_type` varchar(20) NOT NULL,
	`breed_id` varchar(36) NOT NULL,
	`gender` char(1) NOT NULL,
	`dob` date,
	`entry_type` varchar(30) NOT NULL,
	`entry_date` date NOT NULL,
	`source_receipt_id` varchar(36),
	`source_batch_id` varchar(36),
	`item_id` varchar(36) NOT NULL,
	`rfid_tag` varchar(50),
	`ear_tag` varchar(50),
	`sire_animal_id` varchar(36),
	`dam_animal_id` varchar(36),
	`acquisition_cost` decimal(18,4) NOT NULL,
	`landing_cost` decimal(18,4),
	`total_opening_asset_value` decimal(18,4) NOT NULL,
	`current_stage_id` varchar(36),
	`current_batch_id` varchar(36),
	`current_location_id` varchar(36),
	`parity_count` int NOT NULL DEFAULT 0,
	`total_piglets_born_live` int NOT NULL DEFAULT 0,
	`total_piglets_weaned` int NOT NULL DEFAULT 0,
	`current_bio_asset_value` decimal(18,4),
	`total_amortised` decimal(18,4),
	`book_value` decimal(18,4),
	`residual_value` decimal(18,4),
	`amortisation_monthly` decimal(18,4),
	`productive_life_start` date,
	`expected_cull_date` date,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`disposal_date` date,
	`disposal_type` varchar(20),
	`disposal_value` decimal(18,4),
	`gain_loss_on_disposal` decimal(18,4),
	`notes` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `animal_register_animal_id` PRIMARY KEY(`animal_id`),
	CONSTRAINT `uq_animal_register_tenant_code` UNIQUE(`tenant_id`,`animal_code`),
	CONSTRAINT `uq_animal_register_tenant_rfid` UNIQUE(`tenant_id`,`rfid_tag`)
);
--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_breed_id_breed_master_breed_id_fk` FOREIGN KEY (`breed_id`) REFERENCES `breed_master`(`breed_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_source_receipt_id_goods_receipt_receipt_id_fk` FOREIGN KEY (`source_receipt_id`) REFERENCES `goods_receipt`(`receipt_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_source_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`source_batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_current_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`current_batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_curr_location_id_loc_master_loc_id_fk` FOREIGN KEY (`current_location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_sire_animal_id_fk` FOREIGN KEY (`sire_animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_dam_animal_id_fk` FOREIGN KEY (`dam_animal_id`) REFERENCES `animal_register`(`animal_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `animal_register` ADD CONSTRAINT `animal_register_current_stage_id_fk` FOREIGN KEY (`current_stage_id`) REFERENCES `stage_master`(`stage_id`) ON DELETE set null ON UPDATE no action;