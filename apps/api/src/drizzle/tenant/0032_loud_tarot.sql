CREATE TABLE `country_master` (
	`country_id` varchar(36) NOT NULL,
	`iso2` char(2) NOT NULL,
	`iso3` char(3) NOT NULL,
	`country_name` varchar(100) NOT NULL,
	`phone_code` varchar(10),
	`default_tz_id` varchar(36),
	`default_currency_id` varchar(36),
	`flag_emoji` varchar(10),
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `country_master_country_id` PRIMARY KEY(`country_id`),
	CONSTRAINT `country_master_iso2_unique` UNIQUE(`iso2`),
	CONSTRAINT `country_master_iso3_unique` UNIQUE(`iso3`)
);
--> statement-breakpoint
CREATE TABLE `state_province` (
	`state_id` varchar(36) NOT NULL,
	`country_id` varchar(36) NOT NULL,
	`state_code` varchar(10) NOT NULL,
	`state_name` varchar(100) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `state_province_state_id` PRIMARY KEY(`state_id`),
	CONSTRAINT `uq_state_province_country_code` UNIQUE(`country_id`,`state_code`)
);
--> statement-breakpoint
CREATE TABLE `timezone_master` (
	`tz_id` varchar(36) NOT NULL,
	`tz_code` varchar(60) NOT NULL,
	`tz_name` varchar(100) NOT NULL,
	`utc_offset` varchar(10) NOT NULL,
	`offset_minutes` int NOT NULL,
	`is_dst` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `timezone_master_tz_id` PRIMARY KEY(`tz_id`),
	CONSTRAINT `timezone_master_tz_code_unique` UNIQUE(`tz_code`)
);
--> statement-breakpoint
ALTER TABLE `country_master` ADD CONSTRAINT `country_master_default_tz_id_fk` FOREIGN KEY (`default_tz_id`) REFERENCES `timezone_master`(`tz_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `country_master` ADD CONSTRAINT `country_master_default_currency_id_fk` FOREIGN KEY (`default_currency_id`) REFERENCES `currency_master`(`currency_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `state_province` ADD CONSTRAINT `state_province_country_id_country_master_country_id_fk` FOREIGN KEY (`country_id`) REFERENCES `country_master`(`country_id`) ON DELETE cascade ON UPDATE no action;