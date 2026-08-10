CREATE TABLE `qc_batch_detail` (
	`qc_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`source_batch_id` varchar(36) NOT NULL,
	`output_line_id` varchar(36),
	`qc_date` date NOT NULL,
	`inspector_id` varchar(36),
	`total_qty_received` decimal(18,4) NOT NULL,
	`pass_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`fail_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`hold_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`grade_a_qty` decimal(18,4),
	`grade_b_qty` decimal(18,4),
	`grade_c_qty` decimal(18,4),
	`overall_result` varchar(20) NOT NULL,
	`disposition` varchar(30) NOT NULL,
	`qc_notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qc_batch_detail_qc_id` PRIMARY KEY(`qc_id`)
);
--> statement-breakpoint
CREATE TABLE `qc_param_result` (
	`result_id` varchar(36) NOT NULL,
	`qc_id` varchar(36) NOT NULL,
	`param_id` varchar(36) NOT NULL,
	`actual_value` varchar(200) NOT NULL,
	`result_status` varchar(10) NOT NULL,
	`grade_assigned` varchar(10),
	`notes` text,
	CONSTRAINT `qc_param_result_result_id` PRIMARY KEY(`result_id`)
);
--> statement-breakpoint
CREATE TABLE `qc_parameter_master` (
	`param_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`lob_id` varchar(36) NOT NULL,
	`param_code` varchar(50) NOT NULL,
	`param_name` varchar(100) NOT NULL,
	`param_type` varchar(20) NOT NULL,
	`uom` varchar(20),
	`min_value` decimal(18,4),
	`max_value` decimal(18,4),
	`pass_criteria` text,
	`fail_criteria` text,
	`grade_scale` json,
	`is_mandatory` boolean NOT NULL DEFAULT true,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qc_parameter_master_param_id` PRIMARY KEY(`param_id`)
);
--> statement-breakpoint
CREATE TABLE `qr_code_master` (
	`qr_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`output_line_id` varchar(36),
	`qc_id` varchar(36),
	`item_id` varchar(36) NOT NULL,
	`lot_no` varchar(100),
	`pack_no` varchar(50) NOT NULL,
	`production_date` date NOT NULL,
	`expiry_date` date,
	`net_weight` decimal(10,4) NOT NULL,
	`gross_weight` decimal(10,4),
	`pack_uom` varchar(20) NOT NULL,
	`warehouse_id` varchar(36),
	`grade` varchar(10),
	`origin_batch_chain` json,
	`breed` varchar(100),
	`qr_data` json NOT NULL,
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	`generated_by` varchar(36),
	`is_voided` boolean NOT NULL DEFAULT false,
	CONSTRAINT `qr_code_master_qr_id` PRIMARY KEY(`qr_id`)
);
--> statement-breakpoint
ALTER TABLE `qc_batch_detail` ADD CONSTRAINT `qc_batch_detail_source_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`source_batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qc_batch_detail` ADD CONSTRAINT `qc_batch_detail_output_line_id_batch_output_line_line_id_fk` FOREIGN KEY (`output_line_id`) REFERENCES `batch_output_line`(`line_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qc_batch_detail` ADD CONSTRAINT `qc_batch_detail_inspector_id_user_master_user_id_fk` FOREIGN KEY (`inspector_id`) REFERENCES `user_master`(`user_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qc_param_result` ADD CONSTRAINT `qc_param_result_qc_id_qc_batch_detail_qc_id_fk` FOREIGN KEY (`qc_id`) REFERENCES `qc_batch_detail`(`qc_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qc_param_result` ADD CONSTRAINT `qc_param_result_param_id_qc_parameter_master_param_id_fk` FOREIGN KEY (`param_id`) REFERENCES `qc_parameter_master`(`param_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qc_parameter_master` ADD CONSTRAINT `qc_parameter_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qr_code_master` ADD CONSTRAINT `qr_code_master_batch_id_batch_header_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `batch_header`(`batch_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qr_code_master` ADD CONSTRAINT `qr_code_master_output_line_id_batch_output_line_line_id_fk` FOREIGN KEY (`output_line_id`) REFERENCES `batch_output_line`(`line_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qr_code_master` ADD CONSTRAINT `qr_code_master_qc_id_qc_batch_detail_qc_id_fk` FOREIGN KEY (`qc_id`) REFERENCES `qc_batch_detail`(`qc_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qr_code_master` ADD CONSTRAINT `qr_code_master_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qr_code_master` ADD CONSTRAINT `qr_code_master_warehouse_id_warehouse_master_warehouse_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;