ALTER TABLE `resource_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `resource_sub_type` varchar(50);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `asset_code` varchar(50);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `asset_make` varchar(100);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `asset_model` varchar(100);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `asset_serial_no` varchar(100);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `purchase_date` date;--> statement-breakpoint
ALTER TABLE `resource_master` ADD `warranty_expiry_date` date;--> statement-breakpoint
ALTER TABLE `resource_master` ADD `maintenance_frequency_days` int;--> statement-breakpoint
ALTER TABLE `resource_master` ADD `last_maintenance_date` date;--> statement-breakpoint
ALTER TABLE `resource_master` ADD `next_maintenance_date` date;--> statement-breakpoint
ALTER TABLE `resource_master` ADD `maintenance_cost_per_service` decimal(18,4);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `maintenance_vendor` varchar(200);--> statement-breakpoint
ALTER TABLE `resource_master` ADD CONSTRAINT `res_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_master` ADD CONSTRAINT `res_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;