CREATE TABLE `fifo_consumption_log` (
	`consumption_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`layer_id` varchar(36) NOT NULL,
	`ledger_id` varchar(36) NOT NULL,
	`qty_consumed` decimal(18,4) NOT NULL,
	`cost_consumed` decimal(18,4) NOT NULL,
	`consumed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fifo_consumption_log_consumption_id` PRIMARY KEY(`consumption_id`)
);
--> statement-breakpoint
CREATE TABLE `fifo_layer` (
	`layer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`lot_id` varchar(36),
	`ledger_id` varchar(36) NOT NULL,
	`qty_initial` decimal(18,4) NOT NULL,
	`qty_remaining` decimal(18,4) NOT NULL,
	`unit_cost` decimal(18,4) NOT NULL,
	`posting_date` date NOT NULL,
	`is_exhausted` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fifo_layer_layer_id` PRIMARY KEY(`layer_id`)
);
--> statement-breakpoint
CREATE TABLE `goods_issue` (
	`issue_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`issue_no` varchar(50) NOT NULL,
	`issue_type` varchar(30) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`posting_date` date NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`notes` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `goods_issue_issue_id` PRIMARY KEY(`issue_id`),
	CONSTRAINT `uq_tenant_issue_no` UNIQUE(`tenant_id`,`issue_no`)
);
--> statement-breakpoint
CREATE TABLE `goods_issue_line` (
	`line_id` varchar(36) NOT NULL,
	`issue_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`qty` decimal(18,4) NOT NULL,
	`uom_code` varchar(20) NOT NULL,
	`lot_id` varchar(36),
	`serial_id` varchar(36),
	CONSTRAINT `goods_issue_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `goods_receipt` (
	`receipt_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`receipt_no` varchar(50) NOT NULL,
	`receipt_type` varchar(30) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`posting_date` date NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`notes` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `goods_receipt_receipt_id` PRIMARY KEY(`receipt_id`),
	CONSTRAINT `uq_tenant_receipt_no` UNIQUE(`tenant_id`,`receipt_no`)
);
--> statement-breakpoint
CREATE TABLE `goods_receipt_line` (
	`line_id` varchar(36) NOT NULL,
	`receipt_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`qty` decimal(18,4) NOT NULL,
	`uom_code` varchar(20) NOT NULL,
	`unit_cost` decimal(18,4) NOT NULL,
	`total_value` decimal(18,4) NOT NULL,
	`lot_no` varchar(100),
	`serial_no` varchar(100),
	`mfg_date` date,
	`expiry_date` date,
	CONSTRAINT `goods_receipt_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_adjustment` (
	`adjustment_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`adjustment_no` varchar(50) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`posting_date` date NOT NULL,
	`adjustment_type` varchar(20) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`reason_code` varchar(50) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`qty` decimal(18,4) NOT NULL,
	`uom_code` varchar(20) NOT NULL,
	`unit_cost` decimal(18,4) NOT NULL,
	`lot_id` varchar(36),
	`serial_id` varchar(36),
	`lot_no` varchar(100),
	`serial_no` varchar(100),
	`mfg_date` date,
	`expiry_date` date,
	`notes` text,
	`approved_by` varchar(36),
	`approved_at` timestamp,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `inventory_adjustment_adjustment_id` PRIMARY KEY(`adjustment_id`),
	CONSTRAINT `uq_tenant_adjustment_no` UNIQUE(`tenant_id`,`adjustment_no`)
);
--> statement-breakpoint
CREATE TABLE `inventory_balance` (
	`balance_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`lot_id` varchar(36),
	`serial_id` varchar(36),
	`qty_on_hand` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`qty_reserved` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`qty_available` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_balance_balance_id` PRIMARY KEY(`balance_id`),
	CONSTRAINT `uq_tenant_inv_balance_comp_wh_loc_item_lot_serial` UNIQUE(`tenant_id`,`company_id`,`warehouse_id`,`location_id`,`item_id`,`lot_id`,`serial_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_count` (
	`count_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`count_no` varchar(50) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`count_date` date NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`notes` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `inventory_count_count_id` PRIMARY KEY(`count_id`),
	CONSTRAINT `uq_tenant_count_no` UNIQUE(`tenant_id`,`count_no`)
);
--> statement-breakpoint
CREATE TABLE `inventory_count_line` (
	`line_id` varchar(36) NOT NULL,
	`count_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`lot_id` varchar(36),
	`serial_id` varchar(36),
	`qty_expected` decimal(18,4) NOT NULL,
	`qty_counted` decimal(18,4) NOT NULL,
	`variance` decimal(18,4) NOT NULL,
	`unit_cost` decimal(18,4) NOT NULL,
	`reason_code` varchar(50),
	CONSTRAINT `inventory_count_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_journal` (
	`journal_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`journal_no` varchar(50) NOT NULL,
	`posting_date` date NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`notes` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `inventory_journal_journal_id` PRIMARY KEY(`journal_id`),
	CONSTRAINT `uq_tenant_journal_no` UNIQUE(`tenant_id`,`journal_no`)
);
--> statement-breakpoint
CREATE TABLE `inventory_journal_line` (
	`line_id` varchar(36) NOT NULL,
	`journal_id` varchar(36) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`lot_id` varchar(36),
	`serial_id` varchar(36),
	`qty` decimal(18,4) NOT NULL,
	`unit_cost` decimal(18,4) NOT NULL,
	`reason_code` varchar(50) NOT NULL,
	CONSTRAINT `inventory_journal_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_ledger` (
	`ledger_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`lot_id` varchar(36),
	`serial_id` varchar(36),
	`transaction_type` varchar(50) NOT NULL,
	`transaction_date` date NOT NULL,
	`posting_date` date NOT NULL,
	`qty` decimal(18,4) NOT NULL,
	`unit_cost` decimal(18,4) NOT NULL,
	`total_value` decimal(18,4) NOT NULL,
	`ref_doc_type` varchar(50) NOT NULL,
	`ref_doc_id` varchar(36) NOT NULL,
	`ref_doc_line_id` varchar(36),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_ledger_ledger_id` PRIMARY KEY(`ledger_id`)
);
--> statement-breakpoint
CREATE TABLE `lot_master` (
	`lot_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`lot_code` varchar(100) NOT NULL,
	`mfg_date` date,
	`expiry_date` date,
	`qty_initial` decimal(18,4) NOT NULL,
	`qty_on_hand` decimal(18,4) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `lot_master_lot_id` PRIMARY KEY(`lot_id`),
	CONSTRAINT `uq_tenant_item_lot` UNIQUE(`tenant_id`,`item_id`,`lot_code`)
);
--> statement-breakpoint
CREATE TABLE `serial_master` (
	`serial_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`lot_id` varchar(36),
	`serial_no` varchar(100) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'IN_STOCK',
	`warranty_expiry_date` date,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `serial_master_serial_id` PRIMARY KEY(`serial_id`),
	CONSTRAINT `uq_tenant_item_serial` UNIQUE(`tenant_id`,`item_id`,`serial_no`)
);
--> statement-breakpoint
CREATE TABLE `stock_reservation` (
	`reservation_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`lot_id` varchar(36),
	`serial_id` varchar(36),
	`qty_reserved` decimal(18,4) NOT NULL,
	`reservation_type` varchar(30) NOT NULL,
	`ref_doc_type` varchar(50),
	`ref_doc_id` varchar(36),
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`expires_at` timestamp,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_reservation_reservation_id` PRIMARY KEY(`reservation_id`)
);
--> statement-breakpoint
CREATE TABLE `transfer_order` (
	`transfer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`transfer_no` varchar(50) NOT NULL,
	`from_warehouse_id` varchar(36) NOT NULL,
	`to_warehouse_id` varchar(36) NOT NULL,
	`posting_date` date NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`notes` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `transfer_order_transfer_id` PRIMARY KEY(`transfer_id`),
	CONSTRAINT `uq_tenant_transfer_no` UNIQUE(`tenant_id`,`transfer_no`)
);
--> statement-breakpoint
CREATE TABLE `transfer_order_line` (
	`line_id` varchar(36) NOT NULL,
	`transfer_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`from_location_id` varchar(36) NOT NULL,
	`to_location_id` varchar(36) NOT NULL,
	`qty` decimal(18,4) NOT NULL,
	`uom_code` varchar(20) NOT NULL,
	`lot_id` varchar(36),
	`serial_id` varchar(36),
	CONSTRAINT `transfer_order_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
ALTER TABLE `company_master` ADD `default_warehouse_id` varchar(36);--> statement-breakpoint
ALTER TABLE `company_master` ADD `default_location_id` varchar(36);--> statement-breakpoint
ALTER TABLE `fifo_consumption_log` ADD CONSTRAINT `fk_fcl_layer` FOREIGN KEY (`layer_id`) REFERENCES `fifo_layer`(`layer_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fifo_consumption_log` ADD CONSTRAINT `fk_fcl_ledger` FOREIGN KEY (`ledger_id`) REFERENCES `inventory_ledger`(`ledger_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fifo_layer` ADD CONSTRAINT `fk_fifo_lay_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fifo_layer` ADD CONSTRAINT `fk_fifo_lay_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fifo_layer` ADD CONSTRAINT `fk_fifo_lay_loc` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fifo_layer` ADD CONSTRAINT `fk_fifo_lay_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fifo_layer` ADD CONSTRAINT `fk_fifo_lay_lot` FOREIGN KEY (`lot_id`) REFERENCES `lot_master`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fifo_layer` ADD CONSTRAINT `fk_fifo_lay_ledg` FOREIGN KEY (`ledger_id`) REFERENCES `inventory_ledger`(`ledger_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue` ADD CONSTRAINT `fk_gi_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue` ADD CONSTRAINT `fk_gi_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue_line` ADD CONSTRAINT `fk_gil_issue` FOREIGN KEY (`issue_id`) REFERENCES `goods_issue`(`issue_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue_line` ADD CONSTRAINT `fk_gil_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue_line` ADD CONSTRAINT `fk_gil_loc` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue_line` ADD CONSTRAINT `fk_gil_lot` FOREIGN KEY (`lot_id`) REFERENCES `lot_master`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_issue_line` ADD CONSTRAINT `fk_gil_ser` FOREIGN KEY (`serial_id`) REFERENCES `serial_master`(`serial_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt` ADD CONSTRAINT `fk_gr_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt` ADD CONSTRAINT `fk_gr_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt_line` ADD CONSTRAINT `fk_grl_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipt`(`receipt_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt_line` ADD CONSTRAINT `fk_grl_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goods_receipt_line` ADD CONSTRAINT `fk_grl_loc` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_adjustment` ADD CONSTRAINT `fk_inv_adj_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_adjustment` ADD CONSTRAINT `fk_inv_adj_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_adjustment` ADD CONSTRAINT `fk_inv_adj_loc` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_adjustment` ADD CONSTRAINT `fk_inv_adj_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_adjustment` ADD CONSTRAINT `fk_inv_adj_lot` FOREIGN KEY (`lot_id`) REFERENCES `lot_master`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_adjustment` ADD CONSTRAINT `fk_inv_adj_ser` FOREIGN KEY (`serial_id`) REFERENCES `serial_master`(`serial_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_balance` ADD CONSTRAINT `fk_inv_bal_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_balance` ADD CONSTRAINT `fk_inv_bal_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_balance` ADD CONSTRAINT `fk_inv_bal_loc` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_balance` ADD CONSTRAINT `fk_inv_bal_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_balance` ADD CONSTRAINT `fk_inv_bal_lot` FOREIGN KEY (`lot_id`) REFERENCES `lot_master`(`lot_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_balance` ADD CONSTRAINT `fk_inv_bal_ser` FOREIGN KEY (`serial_id`) REFERENCES `serial_master`(`serial_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_count` ADD CONSTRAINT `fk_ic_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_count` ADD CONSTRAINT `fk_ic_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_count_line` ADD CONSTRAINT `fk_icl_count` FOREIGN KEY (`count_id`) REFERENCES `inventory_count`(`count_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_count_line` ADD CONSTRAINT `fk_icl_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_count_line` ADD CONSTRAINT `fk_icl_loc` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_count_line` ADD CONSTRAINT `fk_icl_lot` FOREIGN KEY (`lot_id`) REFERENCES `lot_master`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_count_line` ADD CONSTRAINT `fk_icl_ser` FOREIGN KEY (`serial_id`) REFERENCES `serial_master`(`serial_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_journal` ADD CONSTRAINT `fk_ij_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_journal_line` ADD CONSTRAINT `fk_ijl_journal` FOREIGN KEY (`journal_id`) REFERENCES `inventory_journal`(`journal_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_journal_line` ADD CONSTRAINT `fk_ijl_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_journal_line` ADD CONSTRAINT `fk_ijl_loc` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_journal_line` ADD CONSTRAINT `fk_ijl_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_journal_line` ADD CONSTRAINT `fk_ijl_lot` FOREIGN KEY (`lot_id`) REFERENCES `lot_master`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_journal_line` ADD CONSTRAINT `fk_ijl_ser` FOREIGN KEY (`serial_id`) REFERENCES `serial_master`(`serial_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `fk_inv_ledg_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `fk_inv_ledg_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `fk_inv_ledg_loc` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `fk_inv_ledg_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `fk_inv_ledg_lot` FOREIGN KEY (`lot_id`) REFERENCES `lot_master`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD CONSTRAINT `fk_inv_ledg_ser` FOREIGN KEY (`serial_id`) REFERENCES `serial_master`(`serial_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lot_master` ADD CONSTRAINT `lot_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lot_master` ADD CONSTRAINT `lot_master_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `serial_master` ADD CONSTRAINT `serial_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `serial_master` ADD CONSTRAINT `serial_master_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `serial_master` ADD CONSTRAINT `serial_master_lot_id_lot_master_lot_id_fk` FOREIGN KEY (`lot_id`) REFERENCES `lot_master`(`lot_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_reservation` ADD CONSTRAINT `fk_st_res_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_reservation` ADD CONSTRAINT `fk_st_res_wh` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_reservation` ADD CONSTRAINT `fk_st_res_loc` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_reservation` ADD CONSTRAINT `fk_st_res_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_reservation` ADD CONSTRAINT `fk_st_res_lot` FOREIGN KEY (`lot_id`) REFERENCES `lot_master`(`lot_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_reservation` ADD CONSTRAINT `fk_st_res_ser` FOREIGN KEY (`serial_id`) REFERENCES `serial_master`(`serial_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_order` ADD CONSTRAINT `fk_to_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_order` ADD CONSTRAINT `fk_to_from_wh` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_order` ADD CONSTRAINT `fk_to_to_wh` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_order_line` ADD CONSTRAINT `fk_tol_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `transfer_order`(`transfer_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_order_line` ADD CONSTRAINT `fk_tol_item` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_order_line` ADD CONSTRAINT `fk_tol_from_loc` FOREIGN KEY (`from_location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_order_line` ADD CONSTRAINT `fk_tol_to_loc` FOREIGN KEY (`to_location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_order_line` ADD CONSTRAINT `fk_tol_lot` FOREIGN KEY (`lot_id`) REFERENCES `lot_master`(`lot_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transfer_order_line` ADD CONSTRAINT `fk_tol_ser` FOREIGN KEY (`serial_id`) REFERENCES `serial_master`(`serial_id`) ON DELETE restrict ON UPDATE no action;