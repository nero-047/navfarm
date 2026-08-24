CREATE TABLE `journal_header` (
	`journal_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`journal_no` varchar(50) NOT NULL,
	`posting_date` date NOT NULL,
	`source` varchar(10) NOT NULL,
	`source_document_type` varchar(30),
	`source_document_no` varchar(50),
	`source_ledger_id` varchar(36),
	`description` text,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`total_debit` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`total_credit` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`posted_at` timestamp,
	`posted_by` varchar(36),
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	CONSTRAINT `journal_header_journal_id` PRIMARY KEY(`journal_id`)
);
--> statement-breakpoint
CREATE TABLE `journal_line` (
	`line_id` varchar(36) NOT NULL,
	`journal_id` varchar(36) NOT NULL,
	`line_no` int NOT NULL,
	`gl_account_id` varchar(36) NOT NULL,
	`cost_center_id` varchar(36),
	`debit_amount` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`credit_amount` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`description` varchar(500),
	`nob_id` varchar(36),
	`lob_id` varchar(36),
	CONSTRAINT `journal_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
ALTER TABLE `journal_header` ADD CONSTRAINT `journal_header_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_header` ADD CONSTRAINT `journal_header_source_ledger_id_inventory_ledger_ledger_id_fk` FOREIGN KEY (`source_ledger_id`) REFERENCES `inventory_ledger`(`ledger_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_line` ADD CONSTRAINT `journal_line_journal_id_journal_header_journal_id_fk` FOREIGN KEY (`journal_id`) REFERENCES `journal_header`(`journal_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_line` ADD CONSTRAINT `journal_line_gl_account_id_gl_account_master_gl_account_id_fk` FOREIGN KEY (`gl_account_id`) REFERENCES `gl_account_master`(`gl_account_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_line` ADD CONSTRAINT `journal_line_cost_center_id_cost_center_master_cost_center_id_fk` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center_master`(`cost_center_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_line` ADD CONSTRAINT `journal_line_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `journal_line` ADD CONSTRAINT `journal_line_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;