CREATE TABLE `accounting_period` (
	`period_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`fiscal_year_id` varchar(36) NOT NULL,
	`period_name` varchar(50) NOT NULL,
	`period_no` int NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`is_locked` boolean NOT NULL DEFAULT false,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `accounting_period_period_id` PRIMARY KEY(`period_id`),
	CONSTRAINT `uq_tenant_comp_period` UNIQUE(`tenant_id`,`company_id`,`fiscal_year_id`,`period_no`)
);
--> statement-breakpoint
CREATE TABLE `customer_ledger_entry` (
	`entry_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`customer_id` varchar(36) NOT NULL,
	`posting_date` date NOT NULL,
	`document_type` varchar(30) NOT NULL,
	`document_no` varchar(50) NOT NULL,
	`amount` decimal(18,4) NOT NULL,
	`remaining_amount` decimal(18,4) NOT NULL,
	`due_date` date,
	`gl_entry_id` varchar(36),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_ledger_entry_entry_id` PRIMARY KEY(`entry_id`)
);
--> statement-breakpoint
CREATE TABLE `financial_dimension` (
	`dimension_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`dimension_code` varchar(50) NOT NULL,
	`dimension_name` varchar(100) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `financial_dimension_dimension_id` PRIMARY KEY(`dimension_id`),
	CONSTRAINT `uq_tenant_comp_dim` UNIQUE(`tenant_id`,`company_id`,`dimension_code`)
);
--> statement-breakpoint
CREATE TABLE `financial_dimension_value` (
	`value_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`dimension_id` varchar(36) NOT NULL,
	`value_code` varchar(50) NOT NULL,
	`value_name` varchar(100) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `financial_dimension_value_value_id` PRIMARY KEY(`value_id`),
	CONSTRAINT `uq_tenant_comp_dim_val` UNIQUE(`tenant_id`,`company_id`,`dimension_id`,`value_code`)
);
--> statement-breakpoint
CREATE TABLE `financial_journal` (
	`journal_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`journal_no` varchar(50) NOT NULL,
	`journal_type` varchar(30) NOT NULL,
	`posting_date` date NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'DRAFT',
	`notes` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `financial_journal_journal_id` PRIMARY KEY(`journal_id`),
	CONSTRAINT `uq_tenant_fin_journal_no` UNIQUE(`tenant_id`,`journal_no`)
);
--> statement-breakpoint
CREATE TABLE `financial_journal_line` (
	`line_id` varchar(36) NOT NULL,
	`journal_id` varchar(36) NOT NULL,
	`gl_account_id` varchar(36) NOT NULL,
	`debit` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`credit` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`description` varchar(255),
	`cost_center_id` varchar(36),
	`dimension_values` json,
	`ref_doc_type` varchar(50),
	`ref_doc_id` varchar(36),
	CONSTRAINT `financial_journal_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `fiscal_year` (
	`fiscal_year_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`year_code` varchar(20) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'OPEN',
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `fiscal_year_fiscal_year_id` PRIMARY KEY(`fiscal_year_id`),
	CONSTRAINT `uq_tenant_company_fy` UNIQUE(`tenant_id`,`company_id`,`year_code`)
);
--> statement-breakpoint
CREATE TABLE `general_ledger_entry` (
	`entry_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`gl_account_id` varchar(36) NOT NULL,
	`debit` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`credit` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`running_balance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`posting_date` date NOT NULL,
	`fiscal_year_id` varchar(36) NOT NULL,
	`period_id` varchar(36) NOT NULL,
	`cost_center_id` varchar(36),
	`dimension_values` json,
	`ref_doc_type` varchar(50) NOT NULL,
	`ref_doc_id` varchar(36) NOT NULL,
	`ref_doc_line_id` varchar(36),
	`notes` varchar(255),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `general_ledger_entry_entry_id` PRIMARY KEY(`entry_id`)
);
--> statement-breakpoint
CREATE TABLE `supplier_ledger_entry` (
	`entry_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`supplier_id` varchar(36) NOT NULL,
	`posting_date` date NOT NULL,
	`document_type` varchar(30) NOT NULL,
	`document_no` varchar(50) NOT NULL,
	`amount` decimal(18,4) NOT NULL,
	`remaining_amount` decimal(18,4) NOT NULL,
	`due_date` date,
	`gl_entry_id` varchar(36),
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplier_ledger_entry_entry_id` PRIMARY KEY(`entry_id`)
);
--> statement-breakpoint
ALTER TABLE `gl_account_master` ADD `cost_center_required` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `gl_account_master` ADD `dimension_required` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `accounting_period` ADD CONSTRAINT `fk_ap_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounting_period` ADD CONSTRAINT `fk_ap_fy` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year`(`fiscal_year_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_ledger_entry` ADD CONSTRAINT `fk_cle_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_ledger_entry` ADD CONSTRAINT `fk_cle_cust` FOREIGN KEY (`customer_id`) REFERENCES `customer_master`(`customer_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customer_ledger_entry` ADD CONSTRAINT `fk_cle_gle` FOREIGN KEY (`gl_entry_id`) REFERENCES `general_ledger_entry`(`entry_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_dimension` ADD CONSTRAINT `fk_fd_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_dimension_value` ADD CONSTRAINT `fk_fdv_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_dimension_value` ADD CONSTRAINT `fk_fdv_dim` FOREIGN KEY (`dimension_id`) REFERENCES `financial_dimension`(`dimension_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_journal` ADD CONSTRAINT `fk_fj_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_journal_line` ADD CONSTRAINT `fk_fjl_jour` FOREIGN KEY (`journal_id`) REFERENCES `financial_journal`(`journal_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_journal_line` ADD CONSTRAINT `fk_fjl_gl` FOREIGN KEY (`gl_account_id`) REFERENCES `gl_account_master`(`gl_account_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financial_journal_line` ADD CONSTRAINT `fk_fjl_cc` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center_master`(`cost_center_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fiscal_year` ADD CONSTRAINT `fk_fy_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `general_ledger_entry` ADD CONSTRAINT `fk_gle_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `general_ledger_entry` ADD CONSTRAINT `fk_gle_gl` FOREIGN KEY (`gl_account_id`) REFERENCES `gl_account_master`(`gl_account_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `general_ledger_entry` ADD CONSTRAINT `fk_gle_fy` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_year`(`fiscal_year_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `general_ledger_entry` ADD CONSTRAINT `fk_gle_ap` FOREIGN KEY (`period_id`) REFERENCES `accounting_period`(`period_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `general_ledger_entry` ADD CONSTRAINT `fk_gle_cc` FOREIGN KEY (`cost_center_id`) REFERENCES `cost_center_master`(`cost_center_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_ledger_entry` ADD CONSTRAINT `fk_sle_comp` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_ledger_entry` ADD CONSTRAINT `fk_sle_supp` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_master`(`supplier_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_ledger_entry` ADD CONSTRAINT `fk_sle_gle` FOREIGN KEY (`gl_entry_id`) REFERENCES `general_ledger_entry`(`entry_id`) ON DELETE set null ON UPDATE no action;