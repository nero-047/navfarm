ALTER TABLE `breed_master` MODIFY COLUMN `breed_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `breed_master` ADD `location_id` varchar(36);--> statement-breakpoint
ALTER TABLE `breed_master` ADD CONSTRAINT `breed_master_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;