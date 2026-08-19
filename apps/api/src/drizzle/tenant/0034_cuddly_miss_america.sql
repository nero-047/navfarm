CREATE TABLE `costing_method_config` (
	`method_code` varchar(30) NOT NULL,
	`method_name` varchar(100) NOT NULL,
	`variance_auto` varchar(50) NOT NULL,
	`layer_tracking` boolean NOT NULL DEFAULT false,
	`bio_asset_support` boolean NOT NULL DEFAULT false,
	`fair_value_option` boolean NOT NULL DEFAULT false,
	`amort_option` boolean NOT NULL DEFAULT false,
	`description` text,
	`is_system` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `costing_method_config_method_code` PRIMARY KEY(`method_code`)
);
