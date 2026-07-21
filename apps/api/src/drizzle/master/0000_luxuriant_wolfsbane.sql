CREATE TABLE `audit_log` (
	`audit_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`user_id` varchar(36),
	`action` varchar(50) NOT NULL,
	`entity_name` varchar(100) NOT NULL,
	`entity_id` varchar(36) NOT NULL,
	`old_values` json,
	`new_values` json,
	`ip_address` varchar(50),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_audit_id` PRIMARY KEY(`audit_id`)
);
--> statement-breakpoint
CREATE TABLE `currency_master` (
	`currency_id` varchar(36) NOT NULL,
	`iso_code` char(3) NOT NULL,
	`currency_name` varchar(100) NOT NULL,
	`symbol` varchar(5) NOT NULL,
	`symbol_position` varchar(10) NOT NULL DEFAULT 'PREFIX',
	`decimal_places` int NOT NULL DEFAULT 2,
	`is_system_default` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `currency_master_currency_id` PRIMARY KEY(`currency_id`),
	CONSTRAINT `currency_master_iso_code_unique` UNIQUE(`iso_code`)
);
--> statement-breakpoint
CREATE TABLE `language_master` (
	`lang_id` varchar(36) NOT NULL,
	`lang_code` varchar(10) NOT NULL,
	`lang_name_english` varchar(100) NOT NULL,
	`lang_name_native` varchar(100) NOT NULL,
	`script` varchar(30) NOT NULL,
	`is_rtl` boolean NOT NULL DEFAULT false,
	`is_system_default` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`translation_coverage_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
	`date_format` varchar(30) NOT NULL DEFAULT 'DD/MM/YYYY',
	`number_format` varchar(20) NOT NULL DEFAULT 'IN',
	`decimal_separator` char(1) NOT NULL DEFAULT '.',
	`thousands_separator` char(1) NOT NULL DEFAULT ',',
	`flag_emoji` varchar(10),
	CONSTRAINT `language_master_lang_id` PRIMARY KEY(`lang_id`),
	CONSTRAINT `language_master_lang_code_unique` UNIQUE(`lang_code`)
);
--> statement-breakpoint
CREATE TABLE `lob_master` (
	`lob_id` varchar(36) NOT NULL,
	`nob_id` varchar(36) NOT NULL,
	`lob_code` varchar(50) NOT NULL,
	`lob_name` varchar(100) NOT NULL,
	`costing_method_allowed` varchar(100) NOT NULL,
	`qc_required` varchar(10) NOT NULL DEFAULT 'NO',
	`qr_required` varchar(10) NOT NULL DEFAULT 'NO',
	`batch_copy_allowed` varchar(10) NOT NULL DEFAULT 'NO',
	`scheduler_copy_allowed` varchar(10) NOT NULL DEFAULT 'NO',
	`traceability_required` varchar(10) NOT NULL DEFAULT 'YES',
	`description` text,
	`sort_order` int,
	`is_system` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` date,
	`updated_at` date,
	`extension_config` json,
	CONSTRAINT `lob_master_lob_id` PRIMARY KEY(`lob_id`),
	CONSTRAINT `lob_master_lob_code_unique` UNIQUE(`lob_code`)
);
--> statement-breakpoint
CREATE TABLE `nob_master` (
	`nob_id` varchar(36) NOT NULL,
	`nob_code` varchar(50) NOT NULL,
	`nob_name` varchar(100) NOT NULL,
	`default_costing_method` varchar(20) NOT NULL DEFAULT 'STANDARD',
	`description` text,
	`sort_order` int,
	`is_system` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` date,
	`updated_at` date,
	`extension_config` json,
	CONSTRAINT `nob_master_nob_id` PRIMARY KEY(`nob_id`),
	CONSTRAINT `nob_master_nob_code_unique` UNIQUE(`nob_code`)
);
--> statement-breakpoint
CREATE TABLE `plan_master` (
	`plan_id` varchar(30) NOT NULL,
	`plan_name` varchar(100) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`billing_cycle` varchar(20) NOT NULL DEFAULT 'MONTHLY',
	`max_companies` int NOT NULL DEFAULT 1,
	`max_users` int NOT NULL DEFAULT 5,
	`storage_limit_gb` decimal(8,2) NOT NULL DEFAULT '5.00',
	`feature_flags` json NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plan_master_plan_id` PRIMARY KEY(`plan_id`)
);
--> statement-breakpoint
CREATE TABLE `setup_step_master` (
	`step_id` varchar(36) NOT NULL,
	`step_code` varchar(50) NOT NULL,
	`step_name` varchar(100) NOT NULL,
	`step_description` text,
	`step_order` int NOT NULL,
	`is_mandatory` boolean NOT NULL DEFAULT true,
	`step_category` varchar(30) NOT NULL,
	`estimated_minutes` int,
	`help_url` varchar(300),
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `setup_step_master_step_id` PRIMARY KEY(`step_id`),
	CONSTRAINT `setup_step_master_step_code_unique` UNIQUE(`step_code`)
);
--> statement-breakpoint
CREATE TABLE `tenant_master` (
	`tenant_id` varchar(36) NOT NULL,
	`tenant_code` varchar(20) NOT NULL,
	`tenant_name` varchar(200) NOT NULL,
	`tenant_type` varchar(20),
	`plan_id` varchar(30),
	`plan_start_date` date NOT NULL,
	`plan_end_date` date,
	`billing_cycle` varchar(20),
	`billing_email` varchar(200) NOT NULL,
	`billing_currency_id` varchar(36),
	`max_companies` int NOT NULL DEFAULT 1,
	`max_users` int NOT NULL DEFAULT 5,
	`max_batches_per_month` int,
	`api_rate_limit` int NOT NULL DEFAULT 1000,
	`is_trial` boolean NOT NULL DEFAULT false,
	`trial_end_date` date,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`db_host` varchar(100) NOT NULL DEFAULT 'localhost',
	`db_port` int NOT NULL DEFAULT 3306,
	`db_name` varchar(100) NOT NULL,
	`db_user` varchar(100) NOT NULL DEFAULT 'root',
	`db_password` varchar(200) NOT NULL DEFAULT '',
	CONSTRAINT `tenant_master_tenant_id` PRIMARY KEY(`tenant_id`),
	CONSTRAINT `tenant_master_tenant_code_unique` UNIQUE(`tenant_code`)
);
--> statement-breakpoint
CREATE TABLE `tenant_subscription` (
	`sub_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`plan_code` varchar(30) NOT NULL,
	`feature_flags` json,
	`storage_limit_gb` decimal(8,2) NOT NULL DEFAULT '5.00',
	`support_tier` varchar(20) NOT NULL DEFAULT 'STANDARD',
	`sla_uptime_pct` decimal(5,2) NOT NULL DEFAULT '99.50',
	`renewal_auto` boolean NOT NULL DEFAULT true,
	`payment_method` varchar(30),
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `tenant_subscription_sub_id` PRIMARY KEY(`sub_id`),
	CONSTRAINT `tenant_subscription_tenant_id_unique` UNIQUE(`tenant_id`)
);
--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_tenant_id_tenant_master_tenant_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenant_master`(`tenant_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lob_master` ADD CONSTRAINT `lob_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_master` ADD CONSTRAINT `tenant_master_plan_id_plan_master_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plan_master`(`plan_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_subscription` ADD CONSTRAINT `tenant_subscription_tenant_id_tenant_master_tenant_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenant_master`(`tenant_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tenant_subscription` ADD CONSTRAINT `tenant_subscription_plan_code_plan_master_plan_id_fk` FOREIGN KEY (`plan_code`) REFERENCES `plan_master`(`plan_id`) ON DELETE restrict ON UPDATE no action;
