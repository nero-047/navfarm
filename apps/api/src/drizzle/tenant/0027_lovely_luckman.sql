CREATE TABLE `no_series_master` (
	`series_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`nob_id` varchar(36),
	`lob_id` varchar(36),
	`series_code` varchar(30) NOT NULL,
	`series_name` varchar(150) NOT NULL,
	`document_type` varchar(50) NOT NULL,
	`prefix` varchar(20),
	`date_format` varchar(20),
	`separator` varchar(1) NOT NULL DEFAULT '-',
	`seq_length` int NOT NULL,
	`current_seq` bigint NOT NULL DEFAULT 0,
	`last_generated_code` varchar(80),
	`reset_frequency` varchar(20) NOT NULL DEFAULT 'NEVER',
	`allow_manual` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` timestamp,
	`extension_config` json,
	CONSTRAINT `no_series_master_series_id` PRIMARY KEY(`series_id`),
	CONSTRAINT `uq_no_series_master_tenant_company_code` UNIQUE(`tenant_id`,`company_id`,`series_code`)
);
--> statement-breakpoint
ALTER TABLE `no_series_master` ADD CONSTRAINT `no_series_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `no_series_master` ADD CONSTRAINT `no_series_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;