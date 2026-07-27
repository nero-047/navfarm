CREATE TABLE `customer_master` (
	`customer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`customer_code` varchar(50) NOT NULL,
	`customer_name` varchar(150) NOT NULL,
	`email` varchar(200),
	`mobile` varchar(30) NOT NULL,
	`tax_number` varchar(50),
	`credit_limit` decimal(18,4),
	`address_line1` varchar(255),
	`city` varchar(100),
	`state` varchar(100),
	`country` varchar(100),
	`pincode` varchar(20),
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `customer_master_customer_id` PRIMARY KEY(`customer_id`)
);
--> statement-breakpoint
CREATE TABLE `farm_master` (
	`farm_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`farm_code` varchar(50) NOT NULL,
	`farm_name` varchar(100) NOT NULL,
	`farm_type` varchar(50) NOT NULL,
	`capacity` int NOT NULL DEFAULT 0,
	`address_line1` varchar(255),
	`city` varchar(100),
	`state` varchar(100),
	`country` varchar(100),
	`pincode` varchar(20),
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `farm_master_farm_id` PRIMARY KEY(`farm_id`)
);
--> statement-breakpoint
CREATE TABLE `item_category_master` (
	`category_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`category_code` varchar(50) NOT NULL,
	`category_name` varchar(100) NOT NULL,
	`parent_category_id` varchar(36),
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `item_category_master_category_id` PRIMARY KEY(`category_id`)
);
--> statement-breakpoint
CREATE TABLE `resource_maintenance_log` (
	`log_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`resource_id` varchar(36) NOT NULL,
	`maintenance_date` date NOT NULL,
	`maintenance_type` varchar(50) NOT NULL,
	`description` text,
	`cost` decimal(18,4),
	`performed_by` varchar(100),
	`status` varchar(20) NOT NULL DEFAULT 'COMPLETED',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `resource_maintenance_log_log_id` PRIMARY KEY(`log_id`)
);
--> statement-breakpoint
CREATE TABLE `resource_master` (
	`resource_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`resource_code` varchar(50) NOT NULL,
	`resource_name` varchar(150) NOT NULL,
	`resource_type` varchar(30) NOT NULL,
	`capacity` decimal(18,4),
	`unit` varchar(20),
	`cost_rate` decimal(18,4),
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `resource_master_resource_id` PRIMARY KEY(`resource_id`)
);
--> statement-breakpoint
CREATE TABLE `shed_master` (
	`shed_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`farm_id` varchar(36) NOT NULL,
	`shed_code` varchar(50) NOT NULL,
	`shed_name` varchar(100) NOT NULL,
	`shed_type` varchar(50) NOT NULL,
	`capacity` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `shed_master_shed_id` PRIMARY KEY(`shed_id`)
);
--> statement-breakpoint
CREATE TABLE `species_master` (
	`species_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`species_code` varchar(50) NOT NULL,
	`species_name` varchar(100) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `species_master_species_id` PRIMARY KEY(`species_id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_master` (
	`supplier_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`supplier_code` varchar(50) NOT NULL,
	`supplier_name` varchar(150) NOT NULL,
	`email` varchar(200),
	`phone` varchar(30),
	`tax_number` varchar(50),
	`payment_terms` varchar(50),
	`address_line1` varchar(255),
	`city` varchar(100),
	`state` varchar(100),
	`country` varchar(100),
	`pincode` varchar(20),
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `supplier_master_supplier_id` PRIMARY KEY(`supplier_id`)
);
--> statement-breakpoint
CREATE TABLE `warehouse_master` (
	`warehouse_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`farm_id` varchar(36),
	`warehouse_code` varchar(50) NOT NULL,
	`warehouse_name` varchar(100) NOT NULL,
	`warehouse_type` varchar(50) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `warehouse_master_warehouse_id` PRIMARY KEY(`warehouse_id`)
);
--> statement-breakpoint
ALTER TABLE `breed_master` MODIFY COLUMN `species` varchar(100);--> statement-breakpoint
ALTER TABLE `item_attribute_master` MODIFY COLUMN `tenant_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `item_master` MODIFY COLUMN `created_by` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_master` MODIFY COLUMN `tenant_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `breed_master` ADD `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `species_id` varchar(36);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `status` varchar(20) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE `breed_master` ADD `created_by` varchar(36);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `breed_master` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `breed_master` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `breed_master` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `company_master` ADD `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `company_master` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `item_attribute_master` ADD `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `item_attribute_master` ADD `status` varchar(20) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE `item_attribute_master` ADD `created_by` varchar(36);--> statement-breakpoint
ALTER TABLE `item_attribute_master` ADD `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `item_attribute_master` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `item_attribute_master` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `item_attribute_master` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `item_master` ADD `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `item_master` ADD `category_id` varchar(36);--> statement-breakpoint
ALTER TABLE `item_master` ADD `status` varchar(20) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE `item_master` ADD `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `item_master` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `location_master` ADD `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `location_master` ADD `warehouse_id` varchar(36);--> statement-breakpoint
ALTER TABLE `location_master` ADD `status` varchar(20) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE `location_master` ADD `created_by` varchar(36);--> statement-breakpoint
ALTER TABLE `location_master` ADD `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `location_master` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `location_master` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `location_master` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD `status` varchar(20) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD `created_by` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `uom_master` ADD `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_master` ADD `status` varchar(20) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE `uom_master` ADD `created_by` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_master` ADD `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `uom_master` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `uom_master` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `uom_master` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `customer_master` ADD CONSTRAINT `customer_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farm_master` ADD CONSTRAINT `farm_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_category_master` ADD CONSTRAINT `item_cat_master_parent_cat_id_fk` FOREIGN KEY (`parent_category_id`) REFERENCES `item_category_master`(`category_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_maintenance_log` ADD CONSTRAINT `res_maint_log_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_maintenance_log` ADD CONSTRAINT `res_maint_log_res_id_fk` FOREIGN KEY (`resource_id`) REFERENCES `resource_master`(`resource_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_master` ADD CONSTRAINT `res_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shed_master` ADD CONSTRAINT `shed_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shed_master` ADD CONSTRAINT `shed_master_farm_id_farm_master_farm_id_fk` FOREIGN KEY (`farm_id`) REFERENCES `farm_master`(`farm_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_master` ADD CONSTRAINT `supplier_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warehouse_master` ADD CONSTRAINT `warehouse_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warehouse_master` ADD CONSTRAINT `warehouse_master_farm_id_farm_master_farm_id_fk` FOREIGN KEY (`farm_id`) REFERENCES `farm_master`(`farm_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breed_master` ADD CONSTRAINT `breed_master_species_id_species_master_species_id_fk` FOREIGN KEY (`species_id`) REFERENCES `species_master`(`species_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_master` ADD CONSTRAINT `item_master_category_id_item_category_master_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `item_category_master`(`category_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `location_master_warehouse_id_warehouse_master_warehouse_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;