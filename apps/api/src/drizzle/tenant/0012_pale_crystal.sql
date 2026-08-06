CREATE TABLE `bio_asset_ledger` (
	`entry_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`bio_asset_item_id` varchar(36) NOT NULL,
	`entry_type` varchar(30) NOT NULL,
	`document_no` varchar(50),
	`posting_date` date NOT NULL,
	`asset_tracking_type` varchar(10),
	`lot_no` varchar(50),
	`asset_rfid_no` varchar(100),
	`batch_no` varchar(50),
	`stage` varchar(50),
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`quantity` decimal(18,4),
	`cost_amount` decimal(18,4),
	`cost_amount_each_unit` decimal(18,4),
	`costing_method` varchar(30),
	`nob_id` varchar(36),
	`lob_id` varchar(36),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bio_asset_ledger_entry_id` PRIMARY KEY(`entry_id`)
);
--> statement-breakpoint
CREATE TABLE `goods_receipt` (
	`receipt_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`receipt_no` varchar(50) NOT NULL,
	`posting_date` date NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`supplier_id` varchar(36),
	`external_reference_no` varchar(50),
	`remarks` text,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`posted_at` timestamp,
	`posted_by` varchar(36),
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `goods_receipt_receipt_id` PRIMARY KEY(`receipt_id`)
);
--> statement-breakpoint
CREATE TABLE `goods_receipt_line` (
	`line_id` varchar(36) NOT NULL,
	`receipt_id` varchar(36) NOT NULL,
	`line_no` int NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`uom` varchar(20) NOT NULL,
	`rate` decimal(18,6),
	`amount` decimal(18,4),
	`lot_no` varchar(50),
	`serial_no` varchar(100),
	`expiry_date` date,
	`remarks` varchar(500),
	CONSTRAINT `goods_receipt_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_application` (
	`application_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`inbound_ledger_id` varchar(36) NOT NULL,
	`outbound_ledger_id` varchar(36) NOT NULL,
	`applied_qty` decimal(18,4) NOT NULL,
	`applied_cost_amount` decimal(18,4) NOT NULL,
	`application_date` date NOT NULL,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_application_application_id` PRIMARY KEY(`application_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_ledger` (
	`ledger_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`item_code` varchar(50) NOT NULL,
	`item_description` varchar(200) NOT NULL,
	`document_type` varchar(30) NOT NULL,
	`document_no` varchar(50) NOT NULL,
	`document_line_id` varchar(36),
	`posting_date` date NOT NULL,
	`external_reference_no` varchar(50),
	`entry_type` varchar(20) NOT NULL,
	`transaction_type` varchar(30) NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`remaining_quantity` decimal(18,4),
	`uom` varchar(20) NOT NULL,
	`uom_conversion_factor` decimal(18,6),
	`alternate_quantity` decimal(18,4),
	`rate` decimal(18,6),
	`amount` decimal(18,4),
	`lot_no` varchar(50),
	`serial_no` varchar(100),
	`expiry_date` date,
	`batch_no` varchar(50),
	`location_id` varchar(36),
	`warehouse_id` varchar(36),
	`nob_id` varchar(36),
	`lob_id` varchar(36),
	`category_id` varchar(36),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_ledger_ledger_id` PRIMARY KEY(`ledger_id`)
);
--> statement-breakpoint
ALTER TABLE `bio_asset_ledger` ADD CONSTRAINT `bio_asset_ledger_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bio_asset_ledger` ADD CONSTRAINT `bio_asset_ledger_bio_asset_item_id_item_master_item_id_fk` FOREIGN KEY (`bio_asset_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bio_asset_ledger` ADD CONSTRAINT `bio_asset_ledger_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bio_asset_ledger` ADD CONSTRAINT `bio_asset_ledger_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt` ADD CONSTRAINT `goods_receipt_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt` ADD CONSTRAINT `goods_receipt_warehouse_id_warehouse_master_warehouse_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt` ADD CONSTRAINT `goods_receipt_supplier_id_supplier_master_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_master`(`supplier_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt_line` ADD CONSTRAINT `goods_receipt_line_receipt_id_goods_receipt_receipt_id_fk` FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipt`(`receipt_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt_line` ADD CONSTRAINT `goods_receipt_line_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_application` ADD CONSTRAINT `inventory_application_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_application` ADD CONSTRAINT `inventory_application_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_application` ADD CONSTRAINT `inv_app_inbound_ledger_fk` FOREIGN KEY (`inbound_ledger_id`) REFERENCES `inventory_ledger`(`ledger_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_application` ADD CONSTRAINT `inv_app_outbound_ledger_fk` FOREIGN KEY (`outbound_ledger_id`) REFERENCES `inventory_ledger`(`ledger_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `inventory_ledger_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `inventory_ledger_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `inventory_ledger_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `inventory_ledger_warehouse_id_warehouse_master_warehouse_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `inventory_ledger_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `inventory_ledger_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `inventory_ledger_category_id_item_category_master_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `item_category_master`(`category_id`) ON DELETE restrict ON UPDATE no action;