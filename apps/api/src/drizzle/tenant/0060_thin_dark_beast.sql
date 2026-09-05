ALTER TABLE `cost_center_master` MODIFY COLUMN `cost_center_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `gl_account_master` MODIFY COLUMN `account_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `item_category_master` MODIFY COLUMN `category_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `item_type_master` ADD `code_prefix` varchar(20);--> statement-breakpoint
UPDATE `item_type_master` SET `code_prefix` = `type_code` WHERE `code_prefix` IS NULL;--> statement-breakpoint
ALTER TABLE `item_type_master` MODIFY COLUMN `code_prefix` varchar(20) NOT NULL;
