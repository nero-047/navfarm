ALTER TABLE `gl_mapping_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD `valuation_method` varchar(30);--> statement-breakpoint
ALTER TABLE `item_master` ADD `posting_group` varchar(30);--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD CONSTRAINT `gl_map_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD CONSTRAINT `gl_map_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD CONSTRAINT `gl_map_valuation_method_fk` FOREIGN KEY (`valuation_method`) REFERENCES `costing_method_config`(`method_code`) ON DELETE restrict ON UPDATE no action;