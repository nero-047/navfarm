CREATE TABLE `batch_header` (
	`batch_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_no` varchar(50) NOT NULL,
	`lob_id` varchar(36) NOT NULL,
	`nob_id` varchar(36),
	`costing_method` varchar(20) NOT NULL,
	`breed_id` varchar(36),
	`shed_id` varchar(36),
	`location_id` varchar(36),
	`start_date` date NOT NULL,
	`expected_end_date` date,
	`actual_end_date` date,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`opening_quantity` decimal(18,4) NOT NULL,
	`uom` varchar(20) NOT NULL,
	`closing_quantity` decimal(18,4),
	`total_cost` decimal(18,4),
	`unit_cost` decimal(18,6),
	`remarks` text,
	`closed_at` timestamp,
	`closed_by` varchar(36),
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `batch_header_batch_id` PRIMARY KEY(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_input_line` (
	`line_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`line_no` int NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`source_batch_id` varchar(36),
	`quantity` decimal(18,4) NOT NULL,
	`uom` varchar(20) NOT NULL,
	`rate` decimal(18,6),
	`amount` decimal(18,4),
	CONSTRAINT `batch_input_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_output_line` (
	`line_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`output_type` varchar(20) NOT NULL DEFAULT 'MAIN',
	`cost_split_pct` decimal(6,2) NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`uom` varchar(20) NOT NULL,
	`computed_cost` decimal(18,4),
	`unit_cost` decimal(18,6),
	`warehouse_id` varchar(36),
	CONSTRAINT `batch_output_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_transaction` (
	`transaction_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`transaction_date` date NOT NULL,
	`transaction_type` varchar(20) NOT NULL,
	`item_id` varchar(36),
	`resource_id` varchar(36),
	`quantity` decimal(18,4),
	`uom` varchar(20),
	`rate` decimal(18,6),
	`amount` decimal(18,4),
	`remarks` varchar(500),
	`ledger_id` varchar(36),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `batch_transaction_transaction_id` PRIMARY KEY(`transaction_id`)
);
--> statement-breakpoint
ALTER TABLE `batch_header` ADD CONSTRAINT `batch_header_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_header` ADD CONSTRAINT `batch_header_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_header` ADD CONSTRAINT `batch_header_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_header` ADD CONSTRAINT `batch_header_breed_id_breed_master_breed_id_fk` FOREIGN KEY (`breed_id`) REFERENCES `breed_master`(`breed_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_header` ADD CONSTRAINT `batch_header_shed_id_fk` FOREIGN KEY (`shed_id`) REFERENCES `shed_master`(`shed_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_header` ADD CONSTRAINT `batch_header_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_input_line` ADD CONSTRAINT `batch_input_line_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_input_line` ADD CONSTRAINT `batch_input_line_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_input_line` ADD CONSTRAINT `batch_input_line_source_fk` FOREIGN KEY (`source_batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_output_line` ADD CONSTRAINT `batch_output_line_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_output_line` ADD CONSTRAINT `batch_output_line_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_output_line` ADD CONSTRAINT `batch_output_line_warehouse_id_warehouse_master_warehouse_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD CONSTRAINT `batch_transaction_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD CONSTRAINT `batch_transaction_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD CONSTRAINT `batch_transaction_resource_id_resource_master_resource_id_fk` FOREIGN KEY (`resource_id`) REFERENCES `resource_master`(`resource_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD CONSTRAINT `batch_transaction_ledger_id_inventory_ledger_ledger_id_fk` FOREIGN KEY (`ledger_id`) REFERENCES `inventory_ledger`(`ledger_id`) ON DELETE restrict ON UPDATE no action;