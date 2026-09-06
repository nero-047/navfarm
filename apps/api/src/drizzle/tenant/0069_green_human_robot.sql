ALTER TABLE `breed_lifecycle_stages` ADD `lifecycle_code` varchar(50);--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD `mapping_code` varchar(50);--> statement-breakpoint
ALTER TABLE `medicine_master` ADD `medicine_code` varchar(50);--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD `conversion_code` varchar(50);--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD CONSTRAINT `uq_breed_lifecycle_stages_scope_code` UNIQUE(`tenant_id`,`lifecycle_code`);--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD CONSTRAINT `uq_gl_mapping_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`mapping_code`);--> statement-breakpoint
ALTER TABLE `medicine_master` ADD CONSTRAINT `uq_medicine_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`medicine_code`);--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD CONSTRAINT `uq_uom_conversion_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`conversion_code`);