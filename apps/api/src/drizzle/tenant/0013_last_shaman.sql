CREATE TABLE `goods_issue` (
	`issue_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`issue_no` varchar(50) NOT NULL,
	`posting_date` date NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`cost_center_id` varchar(36),
	`remarks` text,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`posted_at` timestamp,
	`posted_by` varchar(36),
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `goods_issue_issue_id` PRIMARY KEY(`issue_id`)
);
--> statement-breakpoint
CREATE TABLE `goods_issue_line` (
	`line_id` varchar(36) NOT NULL,
	`issue_id` varchar(36) NOT NULL,
	`line_no` int NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`uom` varchar(20) NOT NULL,
	`remarks` varchar(500),
	CONSTRAINT `goods_issue_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `stock_adjustment` (
	`adjustment_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`adjustment_no` varchar(50) NOT NULL,
	`posting_date` date NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`reason` varchar(200),
	`remarks` text,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`posted_at` timestamp,
	`posted_by` varchar(36),
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `stock_adjustment_adjustment_id` PRIMARY KEY(`adjustment_id`)
);
--> statement-breakpoint
CREATE TABLE `stock_adjustment_line` (
	`line_id` varchar(36) NOT NULL,
	`adjustment_id` varchar(36) NOT NULL,
	`line_no` int NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`uom` varchar(20) NOT NULL,
	`rate` decimal(18,6),
	`remarks` varchar(500),
	CONSTRAINT `stock_adjustment_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `stock_transfer` (
	`transfer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`transfer_no` varchar(50) NOT NULL,
	`posting_date` date NOT NULL,
	`from_warehouse_id` varchar(36) NOT NULL,
	`to_warehouse_id` varchar(36) NOT NULL,
	`remarks` text,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`posted_at` timestamp,
	`posted_by` varchar(36),
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `stock_transfer_transfer_id` PRIMARY KEY(`transfer_id`)
);
--> statement-breakpoint
CREATE TABLE `stock_transfer_line` (
	`line_id` varchar(36) NOT NULL,
	`transfer_id` varchar(36) NOT NULL,
	`line_no` int NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`uom` varchar(20) NOT NULL,
	`remarks` varchar(500),
	CONSTRAINT `stock_transfer_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
ALTER TABLE `goods_issue` ADD CONSTRAINT `goods_issue_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue` ADD CONSTRAINT `goods_issue_warehouse_id_warehouse_master_warehouse_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue` ADD CONSTRAINT `goods_issue_cost_center_id_cost_center_master_cost_center_id_fk` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center_master`(`cost_center_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue_line` ADD CONSTRAINT `goods_issue_line_issue_id_goods_issue_issue_id_fk` FOREIGN KEY (`issue_id`) REFERENCES `goods_issue`(`issue_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue_line` ADD CONSTRAINT `goods_issue_line_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_adjustment` ADD CONSTRAINT `stock_adjustment_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_adjustment` ADD CONSTRAINT `stock_adjustment_warehouse_id_warehouse_master_warehouse_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_adjustment_line` ADD CONSTRAINT `stock_adjustment_line_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_adjustment_line` ADD CONSTRAINT `stock_adj_line_adjustment_id_fk` FOREIGN KEY (`adjustment_id`) REFERENCES `stock_adjustment`(`adjustment_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_transfer` ADD CONSTRAINT `stock_transfer_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_transfer` ADD CONSTRAINT `stock_transfer_from_warehouse_fk` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_transfer` ADD CONSTRAINT `stock_transfer_to_warehouse_fk` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_transfer_line` ADD CONSTRAINT `stock_transfer_line_transfer_id_stock_transfer_transfer_id_fk` FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfer`(`transfer_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_transfer_line` ADD CONSTRAINT `stock_transfer_line_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;