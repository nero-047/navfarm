ALTER TABLE `animal_register` ADD `no_of_teats` int;--> statement-breakpoint
ALTER TABLE `animal_register` ADD `tsi` decimal(10,2);--> statement-breakpoint
ALTER TABLE `animal_register` ADD `grading` varchar(20);--> statement-breakpoint
ALTER TABLE `animal_register` ADD `serial_number` varchar(50);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `is_blocked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `item_master` ADD `inventory_gl_account` varchar(36);--> statement-breakpoint
ALTER TABLE `item_master` ADD `cogs_gl_account` varchar(36);--> statement-breakpoint
ALTER TABLE `item_master` ADD `is_blocked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `resource_master` ADD `gl_cost_account` varchar(36);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `department` varchar(100);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `cost_element` varchar(50);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `license_expiry` date;