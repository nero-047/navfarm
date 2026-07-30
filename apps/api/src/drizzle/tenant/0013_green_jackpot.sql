ALTER TABLE `gl_mapping_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD `stage` varchar(30);--> statement-breakpoint
ALTER TABLE `gl_mapping_master` ADD `event_type` varchar(50);--> statement-breakpoint
ALTER TABLE `production_batch` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `production_batch` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `production_batch` ADD `costing_method` varchar(20) DEFAULT 'STANDARD';--> statement-breakpoint
ALTER TABLE `production_batch` ADD `traceability_batch_id` varchar(36);--> statement-breakpoint
ALTER TABLE `production_batch` ADD `qc_inspection_id` varchar(36);