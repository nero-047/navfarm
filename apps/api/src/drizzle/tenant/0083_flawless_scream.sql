ALTER TABLE `animal_register` MODIFY COLUMN `animal_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `batch_header` MODIFY COLUMN `current_stage_code` varchar(255);--> statement-breakpoint
ALTER TABLE `batch_stage_log` MODIFY COLUMN `from_stage_code` varchar(255);--> statement-breakpoint
ALTER TABLE `batch_stage_log` MODIFY COLUMN `to_stage_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` MODIFY COLUMN `lifecycle_code` varchar(255);--> statement-breakpoint
ALTER TABLE `customer_master` MODIFY COLUMN `customer_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `disease_master` MODIFY COLUMN `disease_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `farm_record` MODIFY COLUMN `stage_code` varchar(255);--> statement-breakpoint
ALTER TABLE `feed_formula_master` MODIFY COLUMN `formula_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `gl_mapping_master` MODIFY COLUMN `mapping_code` varchar(255);--> statement-breakpoint
ALTER TABLE `no_series_master` MODIFY COLUMN `last_generated_code` varchar(255);--> statement-breakpoint
ALTER TABLE `reason_master` MODIFY COLUMN `reason_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `resource_master` MODIFY COLUMN `resource_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` MODIFY COLUMN `stage_code` varchar(255);--> statement-breakpoint
ALTER TABLE `species_master` MODIFY COLUMN `species_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `stage_master` MODIFY COLUMN `stage_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `supplier_master` MODIFY COLUMN `supplier_code` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `uom_conversion_master` MODIFY COLUMN `conversion_code` varchar(255);