ALTER TABLE `supplier_master` ADD `vendor_type` varchar(30) DEFAULT 'GENERAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `supplier_master` ADD `is_approved` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `supplier_master` ADD `approved_by` varchar(36);--> statement-breakpoint
ALTER TABLE `supplier_master` ADD `approved_at` timestamp;--> statement-breakpoint
ALTER TABLE `supplier_master` ADD `health_cert_url` varchar(500);--> statement-breakpoint
ALTER TABLE `supplier_master` ADD `breeding_farm_code` varchar(50);--> statement-breakpoint
ALTER TABLE `supplier_master` ADD `bank_account_no_enc` text;--> statement-breakpoint
ALTER TABLE `supplier_master` ADD `bank_ifsc` varchar(20);--> statement-breakpoint
ALTER TABLE `supplier_master` ADD `credit_limit` decimal(18,4);--> statement-breakpoint
ALTER TABLE `supplier_master` ADD CONSTRAINT `supplier_master_approved_by_user_master_user_id_fk` FOREIGN KEY (`approved_by`) REFERENCES `user_master`(`user_id`) ON DELETE restrict ON UPDATE no action;