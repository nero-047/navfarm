ALTER TABLE `animal_register` ADD `age_at_entry_weeks` int;--> statement-breakpoint
ALTER TABLE `item_master` ADD `item_tracking` varchar(20) DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE `item_master` ADD `lead_time_days` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `item_master` ADD `gl_inventory_acct` varchar(36);--> statement-breakpoint
ALTER TABLE `item_master` ADD `gl_cogs_acct` varchar(36);--> statement-breakpoint
ALTER TABLE `location_master` ADD `data_entry_level` varchar(20) DEFAULT 'SHED' NOT NULL;--> statement-breakpoint
ALTER TABLE `location_master` ADD `is_storage` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `location_master` ADD `parent_store_id` varchar(36);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `cost_element` varchar(30) DEFAULT 'DIRECT_LABOR' NOT NULL;--> statement-breakpoint
ALTER TABLE `resource_master` ADD `gl_cost_account` varchar(36);--> statement-breakpoint
ALTER TABLE `resource_master` ADD `department` varchar(100);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `to_batch_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `to_location_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `transfer_item_id` varchar(36);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `transfer_qty_basis` varchar(20);--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `capture_transfer_weight` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `auto_triggers_stage` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `scheduler_parameter_line` ADD `destination_stage_id` varchar(36);--> statement-breakpoint
ALTER TABLE `semen_batch` ADD `boar_balance_sheet_val` decimal(18,4) DEFAULT '0.0000';--> statement-breakpoint
ALTER TABLE `semen_batch` ADD `output_lot_id` varchar(50);--> statement-breakpoint
ALTER TABLE `semen_batch` ADD `inventory_receipt_id` varchar(36);