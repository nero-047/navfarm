CREATE TABLE `feed_formula_ingredients` (
	`ingredient_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`formula_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`inclusion_pct` decimal(6,2),
	`loss_pct` decimal(6,2),
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `feed_formula_ingredients_ingredient_id` PRIMARY KEY(`ingredient_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_formula_master` (
	`formula_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`formula_code` varchar(50) NOT NULL,
	`formula_name` varchar(150) NOT NULL,
	`target_item_id` varchar(36) NOT NULL,
	`batch_size` decimal(18,4) NOT NULL,
	`batch_unit` varchar(20) NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `feed_formula_master_formula_id` PRIMARY KEY(`formula_id`)
);
--> statement-breakpoint
ALTER TABLE `feed_formula_ingredients` ADD CONSTRAINT `feed_ingr_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_formula_ingredients` ADD CONSTRAINT `feed_ingr_formula_id_fk` FOREIGN KEY (`formula_id`) REFERENCES `feed_formula_master`(`formula_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_formula_ingredients` ADD CONSTRAINT `feed_ingr_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_formula_master` ADD CONSTRAINT `feed_form_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_formula_master` ADD CONSTRAINT `feed_form_target_item_id_fk` FOREIGN KEY (`target_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;