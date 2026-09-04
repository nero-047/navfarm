ALTER TABLE `farm_master` MODIFY COLUMN `farm_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `location_master` MODIFY COLUMN `location_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `shed_master` MODIFY COLUMN `shed_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `warehouse_master` MODIFY COLUMN `warehouse_code` varchar(255) NOT NULL;