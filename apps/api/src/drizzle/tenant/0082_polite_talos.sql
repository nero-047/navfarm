ALTER TABLE `inventory_ledger` MODIFY COLUMN `item_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `item_attribute_master` MODIFY COLUMN `attribute_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `item_master` MODIFY COLUMN `item_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `item_type_master` MODIFY COLUMN `type_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `location_type_master` MODIFY COLUMN `type_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `uom_master` MODIFY COLUMN `uom_code` varchar(255) NOT NULL;