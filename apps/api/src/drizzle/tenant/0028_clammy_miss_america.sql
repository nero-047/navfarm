CREATE TABLE `breed_lifecycle_stages` (
	`lifecycle_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`breed_id` varchar(36) NOT NULL,
	`stage_id` varchar(36) NOT NULL,
	`calc_unit` varchar(10) NOT NULL,
	`period_from` int NOT NULL,
	`period_to` int NOT NULL,
	`season_type` varchar(20),
	`feed_item_id` varchar(36),
	`feed_qty_per_head_per_day_kg` decimal(8,4),
	`feed_wastage_pct` decimal(5,2),
	`std_body_weight_kg` decimal(8,3),
	`std_adg_gpd` decimal(8,2),
	`std_fcr` decimal(5,3),
	`std_mortality_rate_pct` decimal(5,3),
	`output_item_id` varchar(36),
	`output_uom` varchar(20),
	`std_output_qty` decimal(10,3),
	`medication_protocol` json,
	`vaccination_protocol` json,
	`resource_requirements` json,
	`kpi_lower_limit` decimal(18,4),
	`kpi_upper_limit` decimal(18,4),
	`alert_severity` varchar(10),
	`notes` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `breed_lifecycle_stages_lifecycle_id` PRIMARY KEY(`lifecycle_id`)
);
--> statement-breakpoint
ALTER TABLE `breed_master` ADD `lactation_days` int;--> statement-breakpoint
ALTER TABLE `breed_master` ADD `residual_value_pct` decimal(5,2);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `productive_life_cycles` int;--> statement-breakpoint
ALTER TABLE `breed_master` ADD `avg_litter_size_born` decimal(6,2);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `avg_litter_size_weaned` decimal(6,2);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `avg_weaning_weight_kg` decimal(6,3);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `farrowing_rate_pct` decimal(5,2);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `boar_doses_per_week` decimal(5,2);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `boar_productive_life_months` int;--> statement-breakpoint
ALTER TABLE `breed_master` ADD `vaccination_schedule` json;--> statement-breakpoint
ALTER TABLE `breed_master` ADD `age_labels` json;--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD CONSTRAINT `breed_lifecycle_stages_breed_id_breed_master_breed_id_fk` FOREIGN KEY (`breed_id`) REFERENCES `breed_master`(`breed_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD CONSTRAINT `breed_lifecycle_stages_stage_id_stage_master_stage_id_fk` FOREIGN KEY (`stage_id`) REFERENCES `stage_master`(`stage_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD CONSTRAINT `breed_lifecycle_stages_feed_item_id_item_master_item_id_fk` FOREIGN KEY (`feed_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD CONSTRAINT `breed_lifecycle_stages_output_item_id_item_master_item_id_fk` FOREIGN KEY (`output_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;