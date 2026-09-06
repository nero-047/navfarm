ALTER TABLE `breed_master` ADD CONSTRAINT `uq_breed_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`breed_code`);--> statement-breakpoint
ALTER TABLE `cost_center_master` ADD CONSTRAINT `uq_cost_center_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`cost_center_code`);--> statement-breakpoint
ALTER TABLE `customer_master` ADD CONSTRAINT `uq_customer_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`customer_code`);--> statement-breakpoint
ALTER TABLE `disease_master` ADD CONSTRAINT `uq_disease_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`disease_code`);--> statement-breakpoint
ALTER TABLE `feed_formula_master` ADD CONSTRAINT `uq_feed_formula_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`formula_code`);--> statement-breakpoint
ALTER TABLE `gl_account_master` ADD CONSTRAINT `uq_gl_account_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`account_code`);--> statement-breakpoint
ALTER TABLE `item_attribute_master` ADD CONSTRAINT `uq_item_attribute_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`attribute_code`);--> statement-breakpoint
ALTER TABLE `item_category_master` ADD CONSTRAINT `uq_item_category_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`category_code`);--> statement-breakpoint
ALTER TABLE `item_master` ADD CONSTRAINT `uq_item_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`item_code`);--> statement-breakpoint
ALTER TABLE `item_type_master` ADD CONSTRAINT `uq_item_type_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`type_code`);--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `uq_location_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`location_code`);--> statement-breakpoint
ALTER TABLE `location_type_master` ADD CONSTRAINT `uq_location_type_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`type_code`);--> statement-breakpoint
ALTER TABLE `no_series_master` ADD CONSTRAINT `uq_no_series_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`series_code`);--> statement-breakpoint
ALTER TABLE `resource_master` ADD CONSTRAINT `uq_resource_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`resource_code`);--> statement-breakpoint
ALTER TABLE `species_master` ADD CONSTRAINT `uq_species_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`species_code`);--> statement-breakpoint
ALTER TABLE `stage_master` ADD CONSTRAINT `uq_stage_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`lob_id`,`stage_code`);--> statement-breakpoint
ALTER TABLE `supplier_master` ADD CONSTRAINT `uq_supplier_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`supplier_code`);--> statement-breakpoint
ALTER TABLE `uom_master` ADD CONSTRAINT `uq_uom_master_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`uom_code`);
