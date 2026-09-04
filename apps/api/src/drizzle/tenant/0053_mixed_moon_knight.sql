ALTER TABLE `item_master` ADD `tracking_series_id` varchar(36);--> statement-breakpoint
ALTER TABLE `item_master` ADD `lead_time_days` int;--> statement-breakpoint
ALTER TABLE `item_master` ADD `item_image_url` varchar(500);--> statement-breakpoint
ALTER TABLE `item_master` ADD CONSTRAINT `item_master_tracking_series_id_no_series_master_series_id_fk` FOREIGN KEY (`tracking_series_id`) REFERENCES `no_series_master`(`series_id`) ON DELETE set null ON UPDATE no action;