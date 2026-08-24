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
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_log_audit_id` PRIMARY KEY(`audit_id`)
);
--> statement-breakpoint
CREATE TABLE `breed_master` (
	`breed_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`nob_id` varchar(36) NOT NULL,
	`lob_id` varchar(36),
	`breed_code` varchar(50) NOT NULL,
	`breed_name` varchar(100) NOT NULL,
	`species` varchar(100) NOT NULL,
	`breed_type` varchar(50) NOT NULL,
	`avg_growth_rate_g_day` decimal(10,4),
	`avg_fcr` decimal(8,4),
	`avg_mortality_pct` decimal(6,2),
	`avg_lay_rate_pct` decimal(6,2),
	`incubation_days` int,
	`gestation_days` int,
	`avg_litter_size` decimal(6,2),
	`mature_age_months` int,
	`productive_life_months` int,
	`premature_years` decimal(5,2),
	`avg_yield_per_unit` decimal(10,4),
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`extension_config` json,
	CONSTRAINT `breed_master_breed_id` PRIMARY KEY(`breed_id`)
);
--> statement-breakpoint
CREATE TABLE `company_address` (
	`address_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`address_type` varchar(30) NOT NULL DEFAULT 'REGISTERED',
	`address_label` varchar(100),
	`line1` varchar(200) NOT NULL,
	`line2` varchar(200),
	`city` varchar(100) NOT NULL,
	`state_id` varchar(36) NOT NULL,
	`country_id` varchar(36) NOT NULL,
	`pincode` varchar(20) NOT NULL,
	`gps_latitude` decimal(10,6),
	`gps_longitude` decimal(10,6),
	`is_primary` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `company_address_address_id` PRIMARY KEY(`address_id`)
);
--> statement-breakpoint
CREATE TABLE `company_contacts` (
	`contact_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`contact_type` varchar(30) NOT NULL,
	`full_name` varchar(200) NOT NULL,
	`designation` varchar(100),
	`email` varchar(200) NOT NULL,
	`phone_primary` varchar(30),
	`phone_secondary` varchar(30),
	`receives_alerts` boolean NOT NULL DEFAULT false,
	`receives_reports` boolean NOT NULL DEFAULT false,
	`is_primary` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `company_contacts_contact_id` PRIMARY KEY(`contact_id`)
);
--> statement-breakpoint
CREATE TABLE `company_currency_config` (
	`curr_config_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`currency_id` varchar(36) NOT NULL,
	`is_base` boolean NOT NULL DEFAULT false,
	`is_reporting` boolean NOT NULL DEFAULT false,
	`display_order` int NOT NULL DEFAULT 1,
	CONSTRAINT `company_currency_config_curr_config_id` PRIMARY KEY(`curr_config_id`)
);
--> statement-breakpoint
CREATE TABLE `company_fiscal` (
	`fiscal_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`fiscal_year_format` varchar(20) NOT NULL DEFAULT 'FY APR MAR',
	`fiscal_start_month` int NOT NULL DEFAULT 4,
	`fiscal_start_day` int NOT NULL DEFAULT 1,
	`current_fiscal_year` varchar(20) NOT NULL,
	`period_type` varchar(20) NOT NULL DEFAULT 'MONTHLY',
	`accounting_standard` varchar(20) NOT NULL DEFAULT 'IND AS',
	`depreciation_method` varchar(30) NOT NULL DEFAULT 'SLM',
	`inventory_valuation` varchar(20) NOT NULL DEFAULT 'STANDARD',
	`gst_filing_frequency` varchar(20),
	`tax_audit_applicable` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `company_fiscal_fiscal_id` PRIMARY KEY(`fiscal_id`),
	CONSTRAINT `company_fiscal_company_id_unique` UNIQUE(`company_id`)
);
--> statement-breakpoint
CREATE TABLE `company_language_config` (
	`config_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`lang_id` varchar(36) NOT NULL,
	`is_default` boolean NOT NULL DEFAULT false,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`set_by` varchar(36),
	`set_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `company_language_config_config_id` PRIMARY KEY(`config_id`)
);
--> statement-breakpoint
CREATE TABLE `company_master` (
	`company_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_code` varchar(20) NOT NULL,
	`company_name` varchar(200) NOT NULL,
	`company_display_name` varchar(100),
	`company_type` varchar(30) NOT NULL,
	`industry_type` varchar(30) NOT NULL,
	`registration_no` varchar(100),
	`tax_id` varchar(100),
	`tax_regime` varchar(20) DEFAULT 'STANDARD',
	`incorporation_date` date,
	`financial_year_start` int NOT NULL DEFAULT 4,
	`base_currency_id` varchar(36) NOT NULL,
	`default_language_id` varchar(36) NOT NULL,
	`default_timezone_id` varchar(100) NOT NULL,
	`country_id` varchar(36) NOT NULL,
	`company_logo_url` varchar(500),
	`company_logo_dark_url` varchar(500),
	`primary_color_hex` varchar(7) NOT NULL DEFAULT '#1F4E79',
	`website` varchar(300),
	`email_domain` varchar(100),
	`support_email` varchar(200),
	`phone_primary` varchar(30),
	`is_multi_farm` boolean NOT NULL DEFAULT false,
	`max_farm_locations` int NOT NULL DEFAULT 1,
	`onboarding_status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`created_by` varchar(36),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`extension_config` json,
	CONSTRAINT `company_master_company_id` PRIMARY KEY(`company_id`)
);
--> statement-breakpoint
CREATE TABLE `company_modules` (
	`module_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`module_code` varchar(50) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT false,
	`activated_on` date,
	`activated_by` varchar(36),
	`license_expiry` date,
	`config_json` json,
	CONSTRAINT `company_modules_module_id` PRIMARY KEY(`module_id`)
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
CREATE TABLE `exchange_rate` (
	`rate_id` varchar(36) NOT NULL,
	`from_currency_id` varchar(36) NOT NULL,
	`to_currency_id` varchar(36) NOT NULL,
	`rate` decimal(18,6) NOT NULL,
	`rate_date` date NOT NULL,
	`rate_source` varchar(30) NOT NULL DEFAULT 'MANUAL',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `exchange_rate_rate_id` PRIMARY KEY(`rate_id`)
);
--> statement-breakpoint
CREATE TABLE `item_attribute_master` (
	`attribute_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`nob_id` varchar(36),
	`lob_id` varchar(36),
	`attribute_code` varchar(50) NOT NULL,
	`attribute_name` varchar(100) NOT NULL,
	`data_type` varchar(20) NOT NULL,
	`list_values` json,
	`unit` varchar(20),
	`is_mandatory` boolean NOT NULL DEFAULT false,
	`affects_costing` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_variant` boolean NOT NULL DEFAULT false,
	CONSTRAINT `item_attribute_master_attribute_id` PRIMARY KEY(`attribute_id`)
);
--> statement-breakpoint
CREATE TABLE `item_attribute_values` (
	`value_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`attribute_id` varchar(36) NOT NULL,
	`attribute_value` text NOT NULL,
	CONSTRAINT `item_attribute_values_value_id` PRIMARY KEY(`value_id`)
);
--> statement-breakpoint
CREATE TABLE `item_master` (
	`item_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`item_code` varchar(50) NOT NULL,
	`item_name` varchar(200) NOT NULL,
	`item_type` varchar(30) NOT NULL,
	`nob_id` varchar(36),
	`lob_id` varchar(36),
	`category` varchar(100),
	`sub_category` varchar(100),
	`uom_primary` varchar(20) NOT NULL,
	`uom_secondary` varchar(20),
	`uom_conversion_factor` decimal(18,6),
	`valuation_method` varchar(20),
	`standard_cost` decimal(18,6),
	`is_lot_tracked` boolean NOT NULL DEFAULT false,
	`is_serial_tracked` boolean NOT NULL DEFAULT false,
	`is_biological_asset` boolean NOT NULL DEFAULT false,
	`is_biological_costing_method` varchar(30),
	`is_inventoriable` boolean NOT NULL DEFAULT true,
	`min_stock_level` decimal(18,4),
	`max_stock_level` decimal(18,4),
	`reorder_level` decimal(18,4),
	`shelf_life_days` int,
	`storage_temp_min` decimal(6,2),
	`storage_temp_max` decimal(6,2),
	`is_qr_enabled` boolean NOT NULL DEFAULT false,
	`qr_trigger_event` varchar(30),
	`is_active` boolean NOT NULL DEFAULT true,
	`extension_config` json,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `item_master_item_id` PRIMARY KEY(`item_id`)
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
CREATE TABLE `language_translations` (
	`trans_id` varchar(36) NOT NULL,
	`lang_id` varchar(36) NOT NULL,
	`module_code` varchar(50) NOT NULL,
	`translation_key` varchar(200) NOT NULL,
	`translation_value` text NOT NULL,
	`is_html` boolean NOT NULL DEFAULT false,
	`is_auto_translated` boolean NOT NULL DEFAULT false,
	`verified_by` varchar(36),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `language_translations_trans_id` PRIMARY KEY(`trans_id`)
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
CREATE TABLE `location_master` (
	`location_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`nob_id` varchar(36),
	`lob_id` varchar(36),
	`location_code` varchar(50) NOT NULL,
	`location_name` varchar(200) NOT NULL,
	`location_level` int NOT NULL,
	`location_type` varchar(50) NOT NULL,
	`parent_location_id` varchar(36),
	`area_size` decimal(18,4),
	`area_unit` varchar(10),
	`max_capacity` decimal(18,4),
	`capacity_uom` varchar(20),
	`current_count` decimal(18,4) NOT NULL DEFAULT '0.00',
	`gps_latitude` decimal(10,8),
	`gps_longitude` decimal(11,8),
	`storage_type` varchar(30),
	`is_quarantine_zone` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`extension_config` json,
	CONSTRAINT `location_master_location_id` PRIMARY KEY(`location_id`)
);
--> statement-breakpoint
CREATE TABLE `nob_lob_extension_config` (
	`config_id` varchar(36) NOT NULL,
	`nob_id` varchar(36),
	`lob_id` varchar(36),
	`config_key` varchar(100) NOT NULL,
	`config_value` varchar(200) NOT NULL,
	`data_type` varchar(30) NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `nob_lob_extension_config_config_id` PRIMARY KEY(`config_id`)
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
CREATE TABLE `notification_config` (
	`notif_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`channel` varchar(20) NOT NULL,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`smtp_host` varchar(200),
	`smtp_port` int,
	`smtp_user` varchar(200),
	`smtp_password_enc` text,
	`from_email` varchar(200),
	`from_name` varchar(100),
	`sms_provider` varchar(30),
	`sms_api_key_enc` text,
	`sms_sender_id` varchar(20),
	`push_fcm_key_enc` text,
	`webhook_url` varchar(500),
	`webhook_secret_enc` text,
	`test_sent_at` timestamp,
	`test_status` varchar(20),
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `notification_config_notif_id` PRIMARY KEY(`notif_id`)
);
--> statement-breakpoint
CREATE TABLE `role_master` (
	`role_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`role_code` varchar(50) NOT NULL,
	`role_name` varchar(100) NOT NULL,
	`role_description` text,
	`is_system_role` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `role_master_role_id` PRIMARY KEY(`role_id`)
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`perm_id` varchar(36) NOT NULL,
	`role_id` varchar(36) NOT NULL,
	`module_code` varchar(50) NOT NULL,
	`resource` varchar(100) NOT NULL,
	`can_view` boolean NOT NULL DEFAULT false,
	`can_create` boolean NOT NULL DEFAULT false,
	`can_edit` boolean NOT NULL DEFAULT false,
	`can_delete` boolean NOT NULL DEFAULT false,
	`can_approve` boolean NOT NULL DEFAULT false,
	`can_export` boolean NOT NULL DEFAULT false,
	`can_print` boolean NOT NULL DEFAULT false,
	`field_restrictions` json,
	CONSTRAINT `role_permissions_perm_id` PRIMARY KEY(`perm_id`)
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
CREATE TABLE `setup_wizard_log` (
	`log_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`step_id` varchar(36) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`completed_at` timestamp,
	`completed_by` varchar(36),
	`attempt_count` int NOT NULL DEFAULT 0,
	`data_snapshot` json,
	`notes` text,
	CONSTRAINT `setup_wizard_log_log_id` PRIMARY KEY(`log_id`)
);
--> statement-breakpoint
CREATE TABLE `uom_conversion_master` (
	`conversion_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`item_id` varchar(36),
	`from_uom` varchar(20) NOT NULL,
	`to_uom` varchar(20) NOT NULL,
	`conversion_factor` decimal(18,8) NOT NULL,
	`effective_from` date NOT NULL,
	`effective_to` date,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `uom_conversion_master_conversion_id` PRIMARY KEY(`conversion_id`)
);
--> statement-breakpoint
CREATE TABLE `uom_master` (
	`uom_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`uom_code` varchar(20) NOT NULL,
	`uom_name` varchar(100) NOT NULL,
	`uom_type` varchar(20) NOT NULL,
	`decimal_places` int NOT NULL DEFAULT 0,
	`is_base_uom` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`extension_config` json,
	CONSTRAINT `uom_master_uom_id` PRIMARY KEY(`uom_id`)
);
--> statement-breakpoint
CREATE TABLE `user_language_pref` (
	`pref_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`lang_id` varchar(36) NOT NULL,
	`date_format_override` varchar(30),
	`number_format_override` varchar(20),
	`is_active` boolean NOT NULL DEFAULT true,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_language_pref_pref_id` PRIMARY KEY(`pref_id`)
);
--> statement-breakpoint
CREATE TABLE `user_master` (
	`user_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`full_name` varchar(200) NOT NULL,
	`email` varchar(200) NOT NULL,
	`phone` varchar(30),
	`password_hash` varchar(200) NOT NULL,
	`auth_provider` varchar(20) NOT NULL DEFAULT 'EMAIL',
	`auth_provider_id` varchar(200),
	`mfa_enabled` boolean NOT NULL DEFAULT false,
	`mfa_method` varchar(20),
	`mfa_secret` varchar(100),
	`user_type` varchar(20) NOT NULL DEFAULT 'STAFF',
	`employee_id` varchar(50),
	`department` varchar(100),
	`designation` varchar(100),
	`profile_photo_url` varchar(500),
	`lang_pref_id` varchar(36),
	`timezone_pref_id` varchar(100),
	`last_login_at` timestamp,
	`last_login_ip` varchar(50),
	`failed_login_count` int NOT NULL DEFAULT 0,
	`locked_until` timestamp,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`invited_by` varchar(36),
	`deleted_at` timestamp,
	`deleted_by` varchar(36),
	CONSTRAINT `user_master_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `user_master_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `user_role_assignment` (
	`assign_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`role_id` varchar(36) NOT NULL,
	`assigned_by` varchar(36) NOT NULL,
	`assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`expires_at` timestamp,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `user_role_assignment_assign_id` PRIMARY KEY(`assign_id`)
);
--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master`(`user_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breed_master` ADD CONSTRAINT `breed_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `breed_master` ADD CONSTRAINT `breed_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_address` ADD CONSTRAINT `company_address_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_contacts` ADD CONSTRAINT `company_contacts_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_currency_config` ADD CONSTRAINT `company_currency_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_currency_config` ADD CONSTRAINT `comp_curr_config_curr_id_fk` FOREIGN KEY (`currency_id`) REFERENCES `currency_master`(`currency_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_fiscal` ADD CONSTRAINT `company_fiscal_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_language_config` ADD CONSTRAINT `company_language_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_language_config` ADD CONSTRAINT `company_language_config_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master`(`lang_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `company_modules` ADD CONSTRAINT `company_modules_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exchange_rate` ADD CONSTRAINT `exchange_rate_from_currency_id_currency_master_currency_id_fk` FOREIGN KEY (`from_currency_id`) REFERENCES `currency_master`(`currency_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exchange_rate` ADD CONSTRAINT `exchange_rate_to_currency_id_currency_master_currency_id_fk` FOREIGN KEY (`to_currency_id`) REFERENCES `currency_master`(`currency_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_attribute_master` ADD CONSTRAINT `item_attribute_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_attribute_master` ADD CONSTRAINT `item_attribute_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_attribute_values` ADD CONSTRAINT `item_attribute_values_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_attribute_values` ADD CONSTRAINT `item_attr_vals_attr_id_fk` FOREIGN KEY (`attribute_id`) REFERENCES `item_attribute_master`(`attribute_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_master` ADD CONSTRAINT `item_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_master` ADD CONSTRAINT `item_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `language_translations` ADD CONSTRAINT `language_translations_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master`(`lang_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lob_master` ADD CONSTRAINT `lob_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `location_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `location_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `loc_master_parent_loc_id_fk` FOREIGN KEY (`parent_location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nob_lob_extension_config` ADD CONSTRAINT `nob_lob_extension_config_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nob_lob_extension_config` ADD CONSTRAINT `nob_lob_extension_config_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_config` ADD CONSTRAINT `notification_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_master` ADD CONSTRAINT `role_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_role_master_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role_master`(`role_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `setup_wizard_log` ADD CONSTRAINT `setup_wizard_log_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `setup_wizard_log` ADD CONSTRAINT `setup_wizard_log_step_id_setup_step_master_step_id_fk` FOREIGN KEY (`step_id`) REFERENCES `setup_step_master`(`step_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `uom_conversion_master` ADD CONSTRAINT `uom_conversion_master_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_language_pref` ADD CONSTRAINT `user_language_pref_lang_id_language_master_lang_id_fk` FOREIGN KEY (`lang_id`) REFERENCES `language_master`(`lang_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_master` ADD CONSTRAINT `user_master_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_role_assignment` ADD CONSTRAINT `user_role_assignment_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master`(`user_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_role_assignment` ADD CONSTRAINT `user_role_assignment_role_id_role_master_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role_master`(`role_id`) ON DELETE restrict ON UPDATE no action;
