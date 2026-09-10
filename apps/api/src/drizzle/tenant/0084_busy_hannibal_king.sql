ALTER TABLE `breed_lifecycle_stages` ADD `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `cost_center_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `cost_center_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `customer_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `customer_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `disease_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `disease_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `feed_formula_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `feed_formula_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `gl_account_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `gl_account_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `item_category_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `item_category_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `item_type_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `item_type_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `location_type_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `location_type_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `reason_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `reason_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `species_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `species_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `supplier_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `supplier_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD CONSTRAINT `breed_lifecycle_stages_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD CONSTRAINT `breed_lifecycle_stages_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD CONSTRAINT `breed_lifecycle_stages_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cost_center_master` ADD CONSTRAINT `cost_center_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cost_center_master` ADD CONSTRAINT `cost_center_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_master` ADD CONSTRAINT `customer_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_master` ADD CONSTRAINT `customer_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disease_master` ADD CONSTRAINT `disease_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disease_master` ADD CONSTRAINT `disease_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_formula_master` ADD CONSTRAINT `feed_formula_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_formula_master` ADD CONSTRAINT `feed_formula_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gl_account_master` ADD CONSTRAINT `gl_account_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gl_account_master` ADD CONSTRAINT `gl_account_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_category_master` ADD CONSTRAINT `item_category_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_category_master` ADD CONSTRAINT `item_category_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_type_master` ADD CONSTRAINT `item_type_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_type_master` ADD CONSTRAINT `item_type_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_type_master` ADD CONSTRAINT `location_type_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_type_master` ADD CONSTRAINT `location_type_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reason_master` ADD CONSTRAINT `reason_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reason_master` ADD CONSTRAINT `reason_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `species_master` ADD CONSTRAINT `species_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `species_master` ADD CONSTRAINT `species_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_master` ADD CONSTRAINT `supplier_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_master` ADD CONSTRAINT `supplier_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD CONSTRAINT `uom_conversion_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD CONSTRAINT `uom_conversion_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uom_master` ADD CONSTRAINT `uom_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uom_master` ADD CONSTRAINT `uom_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;