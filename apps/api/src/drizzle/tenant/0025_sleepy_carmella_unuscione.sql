ALTER TABLE `location_master` ADD `location_address` varchar(500);--> statement-breakpoint
ALTER TABLE `location_master` ADD `silo_capacity_kg` decimal(12,2);--> statement-breakpoint
ALTER TABLE `location_master` ADD `silo_reorder_days` int;--> statement-breakpoint
ALTER TABLE `location_master` ADD `downtime_days_required` int;--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `uq_location_master_tenant_company_code` UNIQUE(`tenant_id`,`company_id`,`location_code`);