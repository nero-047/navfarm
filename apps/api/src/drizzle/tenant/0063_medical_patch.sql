ALTER TABLE `cost_center_master` MODIFY COLUMN `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `customer_master` MODIFY COLUMN `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `disease_master` MODIFY COLUMN `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `feed_formula_ingredients` MODIFY COLUMN `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `feed_formula_master` MODIFY COLUMN `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `gl_account_master` MODIFY COLUMN `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `gl_mapping_master` MODIFY COLUMN `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `medicine_master` MODIFY COLUMN `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `resource_master` MODIFY COLUMN `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `supplier_master` MODIFY COLUMN `company_id` varchar(36);