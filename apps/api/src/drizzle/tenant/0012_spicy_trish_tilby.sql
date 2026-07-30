CREATE TABLE `agri_batch` (
	`batch_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`batch_code` varchar(100) NOT NULL,
	`lob_id` varchar(36),
	`costing_method` varchar(20) DEFAULT 'STANDARD',
	`crop_item_id` varchar(36),
	`area_acres` decimal(10,2),
	`location_id` varchar(36),
	`batch_status` varchar(20) DEFAULT 'ACTIVE',
	`bio_asset_stage` varchar(20),
	`premature_years` int DEFAULT 0,
	`nca_cost` decimal(18,4),
	`annual_amortisation` decimal(18,4),
	`season_year` int,
	`sowing_date` date,
	`expected_harvest_date` date,
	`actual_harvest_date` date,
	`parent_batch_id` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_batch_batch_id` PRIMARY KEY(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_crop_calendar` (
	`activity_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`plan_id` varchar(36),
	`activity_type` varchar(50) NOT NULL,
	`activity_name` varchar(200) NOT NULL,
	`scheduled_date` date,
	`actual_date` date,
	`status` varchar(20) DEFAULT 'PENDING',
	`assigned_to` varchar(200),
	`cost_estimated` decimal(12,4),
	`cost_actual` decimal(12,4),
	`remarks` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_crop_calendar_activity_id` PRIMARY KEY(`activity_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_crop_plan` (
	`plan_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`field_id` varchar(36),
	`season` varchar(50) NOT NULL,
	`crop_item_id` varchar(36),
	`crop_variety` varchar(200),
	`sowing_method` varchar(50),
	`planned_sowing_date` date,
	`actual_sowing_date` date,
	`planned_harvest_date` date,
	`actual_harvest_date` date,
	`target_yield_kg_acre` decimal(10,2),
	`actual_yield_kg_acre` decimal(10,2),
	`seed_qty_kg` decimal(10,2),
	`seed_rate_kg_acre` decimal(8,2),
	`plan_status` varchar(20) DEFAULT 'PLANNED',
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_crop_plan_plan_id` PRIMARY KEY(`plan_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_fertilizer_app` (
	`app_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`field_id` varchar(36),
	`plan_id` varchar(36),
	`app_date` date NOT NULL,
	`fertilizer_item_id` varchar(36),
	`fertilizer_name` varchar(200),
	`qty_kg` decimal(10,2) NOT NULL,
	`qty_per_acre` decimal(10,2),
	`method` varchar(50),
	`growth_stage` varchar(100),
	`cost` decimal(10,4),
	`inventory_gi_id` varchar(36),
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_fertilizer_app_app_id` PRIMARY KEY(`app_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_field` (
	`field_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`farm_id` varchar(36),
	`field_code` varchar(100) NOT NULL,
	`field_name` varchar(200) NOT NULL,
	`area_acres` decimal(12,4) NOT NULL,
	`area_hectares` decimal(12,4),
	`soil_type` varchar(100),
	`soil_ph` decimal(5,2),
	`gps_lat` decimal(11,8),
	`gps_long` decimal(11,8),
	`irrigation_type` varchar(50),
	`water_source` varchar(100),
	`field_status` varchar(20) DEFAULT 'AVAILABLE',
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `agri_field_field_id` PRIMARY KEY(`field_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_field_input` (
	`input_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`input_date` date NOT NULL,
	`entry_type` varchar(30) NOT NULL,
	`item_id` varchar(36),
	`qty` decimal(18,4) NOT NULL,
	`uom_id` varchar(36),
	`unit_rate` decimal(18,6),
	`amount` decimal(18,4),
	`notes` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_field_input_input_id` PRIMARY KEY(`input_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_harvest_plan` (
	`harvest_plan_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`plan_id` varchar(36),
	`target_harvest_date` date NOT NULL,
	`expected_yield_kg` decimal(14,2),
	`harvest_method` varchar(50),
	`resources_required` text,
	`status` varchar(20) DEFAULT 'PLANNED',
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_harvest_plan_harvest_plan_id` PRIMARY KEY(`harvest_plan_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_harvest_record` (
	`harvest_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`harvest_date` date NOT NULL,
	`harvest_type` varchar(20) DEFAULT 'FULL',
	`output_item_id` varchar(36),
	`qty_harvested` decimal(18,4) NOT NULL,
	`uom_id` varchar(36),
	`unit_cost` decimal(18,6),
	`total_value` decimal(18,4),
	`lot_no` varchar(100),
	`qc_result` varchar(20),
	`notes` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_harvest_record_harvest_id` PRIMARY KEY(`harvest_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_irrigation_log` (
	`log_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`field_id` varchar(36),
	`plan_id` varchar(36),
	`irrigation_date` date NOT NULL,
	`method` varchar(50),
	`duration_hrs` decimal(8,2),
	`volume_litre` decimal(14,2),
	`water_source` varchar(100),
	`cost` decimal(10,4),
	`remarks` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_irrigation_log_log_id` PRIMARY KEY(`log_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_pesticide_app` (
	`app_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`field_id` varchar(36),
	`plan_id` varchar(36),
	`app_date` date NOT NULL,
	`pest_type` varchar(100),
	`pest_name` varchar(200),
	`pesticide_item_id` varchar(36),
	`pesticide_name` varchar(200),
	`qty_litre` decimal(10,2),
	`dilution_ratio` varchar(50),
	`phi_days` int,
	`safe_harvest_date` date,
	`applicator` varchar(200),
	`weather_conditions` varchar(100),
	`cost` decimal(10,4),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_pesticide_app_app_id` PRIMARY KEY(`app_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_resource_assignment` (
	`assignment_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`plan_id` varchar(36),
	`activity_id` varchar(36),
	`field_id` varchar(36),
	`resource_id` varchar(36),
	`assigned_date` date NOT NULL,
	`hours_planned` decimal(8,2),
	`hours_actual` decimal(8,2),
	`rate_per_hour` decimal(10,4),
	`total_cost` decimal(12,4),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_resource_assignment_assignment_id` PRIMARY KEY(`assignment_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_soil_analysis` (
	`analysis_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`field_id` varchar(36),
	`test_date` date NOT NULL,
	`lab_name` varchar(200),
	`report_no` varchar(100),
	`ph` decimal(5,2),
	`nitrogen_kg_ha` decimal(10,2),
	`phosphorus_kg_ha` decimal(10,2),
	`potassium_kg_ha` decimal(10,2),
	`organic_matter_pct` decimal(6,2),
	`ec_ds_m` decimal(8,4),
	`recommendations` text,
	`next_test_due` date,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_soil_analysis_analysis_id` PRIMARY KEY(`analysis_id`)
);
--> statement-breakpoint
CREATE TABLE `agri_yield_analysis` (
	`analysis_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`plan_id` varchar(36),
	`harvest_plan_id` varchar(36),
	`field_id` varchar(36),
	`actual_yield_kg` decimal(14,2) NOT NULL,
	`actual_yield_kg_acre` decimal(10,2),
	`planned_yield_kg` decimal(14,2),
	`yield_variance_kg` decimal(14,2),
	`yield_variance_pct` decimal(8,2),
	`total_production_cost` decimal(18,4),
	`cost_per_kg` decimal(10,4),
	`cost_per_acre` decimal(12,4),
	`sale_price_per_kg` decimal(10,4),
	`total_revenue` decimal(18,4),
	`gross_margin` decimal(18,4),
	`gross_margin_pct` decimal(8,2),
	`inventory_gr_id` varchar(36),
	`calculated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agri_yield_analysis_analysis_id` PRIMARY KEY(`analysis_id`)
);
--> statement-breakpoint
CREATE TABLE `alert_event` (
	`alert_id` varchar(36) NOT NULL,
	`rule_id` varchar(36),
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`severity` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
	`acknowledged_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_event_alert_id` PRIMARY KEY(`alert_id`)
);
--> statement-breakpoint
CREATE TABLE `alert_rule` (
	`rule_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`rule_name` varchar(100) NOT NULL,
	`event_type` varchar(50) NOT NULL,
	`metric_name` varchar(50) NOT NULL,
	`operator` varchar(10) NOT NULL DEFAULT 'GT',
	`threshold_value` decimal(18,4) NOT NULL,
	`severity` varchar(20) NOT NULL DEFAULT 'WARNING',
	`is_enabled` boolean NOT NULL DEFAULT true,
	CONSTRAINT `alert_rule_rule_id` PRIMARY KEY(`rule_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_batch` (
	`batch_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`batch_code` varchar(100) NOT NULL,
	`lob_id` varchar(36),
	`costing_method` varchar(20) DEFAULT 'BIO_ASSET',
	`species_item_id` varchar(36),
	`location_id` varchar(36),
	`stocking_date` date,
	`fingerlings_qty` int,
	`nca_stocking_cost` decimal(18,4),
	`current_biomass_kg` decimal(12,3),
	`batch_status` varchar(20) DEFAULT 'ACTIVE',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_batch_batch_id` PRIMARY KEY(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_batch_transfer` (
	`transfer_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`batch_id` varchar(36),
	`from_pond_id` varchar(36),
	`to_pond_id` varchar(36),
	`transfer_date` date NOT NULL,
	`qty_transferred` int NOT NULL,
	`avg_weight_g` decimal(8,2),
	`reason` varchar(200),
	`recorded_by` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_batch_transfer_transfer_id` PRIMARY KEY(`transfer_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_daily_entry` (
	`entry_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`entry_date` date NOT NULL,
	`entry_type` varchar(30) NOT NULL,
	`item_id` varchar(36),
	`qty` decimal(18,4),
	`sample_weight_g` decimal(8,2),
	`unit_rate` decimal(18,6),
	`amount` decimal(18,4),
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_daily_entry_entry_id` PRIMARY KEY(`entry_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_disease_event` (
	`disease_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`pond_id` varchar(36),
	`batch_id` varchar(36),
	`event_date` date NOT NULL,
	`symptoms` text NOT NULL,
	`diagnosis` varchar(500),
	`pathogen` varchar(200),
	`severity` varchar(20) DEFAULT 'MODERATE',
	`treatment_protocol` text,
	`medicine_used` varchar(500),
	`withdrawal_days` int,
	`vet_name` varchar(200),
	`outcome` varchar(30),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_disease_event_disease_id` PRIMARY KEY(`disease_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_feeding_schedule` (
	`schedule_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`pond_id` varchar(36),
	`batch_id` varchar(36),
	`feed_item_id` varchar(36),
	`daily_rate_pct` decimal(5,2),
	`feeds_per_day` int DEFAULT 2,
	`feed_times` varchar(200),
	`effective_from` date,
	`effective_to` date,
	`is_active` boolean DEFAULT true,
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_feeding_schedule_schedule_id` PRIMARY KEY(`schedule_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_growth_sample` (
	`sample_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`pond_id` varchar(36),
	`batch_id` varchar(36),
	`sample_date` date NOT NULL,
	`culture_day` int,
	`sample_count` int NOT NULL,
	`avg_weight_g` decimal(10,2) NOT NULL,
	`total_estimated_biomass_kg` decimal(14,2),
	`survival_rate_pct` decimal(6,2),
	`fcr_running` decimal(6,3),
	`adg_g` decimal(8,3),
	`recorded_by` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_growth_sample_sample_id` PRIMARY KEY(`sample_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_harvest_record` (
	`harvest_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`harvest_date` date NOT NULL,
	`harvest_type` varchar(20) DEFAULT 'PARTIAL',
	`live_fish_kg` decimal(12,3) NOT NULL,
	`avg_weight_kg` decimal(8,3),
	`unit_cost` decimal(18,6),
	`total_value` decimal(18,4),
	`lot_no` varchar(100),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_harvest_record_harvest_id` PRIMARY KEY(`harvest_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_mortality_event` (
	`event_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`pond_id` varchar(36),
	`batch_id` varchar(36),
	`event_date` date NOT NULL,
	`qty_dead` int NOT NULL,
	`avg_weight_g` decimal(8,2),
	`cause` varchar(200),
	`remarks` text,
	`action_taken` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_mortality_event_event_id` PRIMARY KEY(`event_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_pond` (
	`pond_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`farm_id` varchar(36),
	`pond_code` varchar(100) NOT NULL,
	`pond_name` varchar(200) NOT NULL,
	`pond_type` varchar(30) DEFAULT 'EARTHEN',
	`area_sqm` decimal(12,2),
	`depth_m` decimal(6,2),
	`water_volume_m3` decimal(14,2),
	`water_source` varchar(100),
	`aerator_count` int,
	`aerator_hp` decimal(6,2),
	`pond_status` varchar(20) DEFAULT 'EMPTY',
	`current_batch_id` varchar(36),
	`location_id` varchar(36),
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `aqua_pond_pond_id` PRIMARY KEY(`pond_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_pond_treatment` (
	`treatment_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`pond_id` varchar(36),
	`treatment_date` date NOT NULL,
	`purpose` varchar(50) NOT NULL,
	`chemical_name` varchar(200) NOT NULL,
	`qty_kg` decimal(10,2),
	`application_method` varchar(100),
	`withdrawal_period_days` int,
	`applied_by` varchar(200),
	`cost` decimal(10,4),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_pond_treatment_treatment_id` PRIMARY KEY(`treatment_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_slaughter_record` (
	`slaughter_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`source_batch_id` varchar(36),
	`slaughter_date` date NOT NULL,
	`input_kg` decimal(12,3) NOT NULL,
	`input_cost` decimal(18,4),
	`overhead_cost` decimal(18,4) DEFAULT '0',
	`fillet_kg` decimal(12,3),
	`fillet_split_pct` decimal(5,2) DEFAULT '70.00',
	`fillet_unit_cost` decimal(18,6),
	`meal_kg` decimal(12,3),
	`meal_split_pct` decimal(5,2) DEFAULT '15.00',
	`meal_unit_cost` decimal(18,6),
	`skin_kg` decimal(12,3),
	`skin_split_pct` decimal(5,2) DEFAULT '10.00',
	`skin_unit_cost` decimal(18,6),
	`other_kg` decimal(12,3),
	`other_split_pct` decimal(5,2) DEFAULT '5.00',
	`qc_freshness_grade` varchar(10),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_slaughter_record_slaughter_id` PRIMARY KEY(`slaughter_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_stocking_event` (
	`stocking_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`pond_id` varchar(36),
	`tank_id` varchar(36),
	`batch_id` varchar(36),
	`species_id` varchar(36),
	`stocking_date` date NOT NULL,
	`fingerlings_qty` int NOT NULL,
	`avg_fingerling_weight_g` decimal(8,2),
	`source` varchar(200),
	`supplier_id` varchar(36),
	`stocking_density_per_sqm` decimal(8,2),
	`unit_cost` decimal(10,4),
	`total_cost` decimal(14,4),
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_stocking_event_stocking_id` PRIMARY KEY(`stocking_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_tank` (
	`tank_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`farm_id` varchar(36),
	`tank_code` varchar(100) NOT NULL,
	`tank_name` varchar(200) NOT NULL,
	`system_type` varchar(50),
	`capacity_litre` decimal(14,2),
	`shape` varchar(30),
	`material` varchar(50),
	`filter_type` varchar(100),
	`tank_status` varchar(20) DEFAULT 'EMPTY',
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_tank_tank_id` PRIMARY KEY(`tank_id`)
);
--> statement-breakpoint
CREATE TABLE `aqua_water_quality` (
	`log_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`pond_id` varchar(36),
	`tank_id` varchar(36),
	`batch_id` varchar(36),
	`log_date` date NOT NULL,
	`log_time` varchar(10),
	`ph` decimal(5,2),
	`do_mg_l` decimal(6,2),
	`temperature_c` decimal(5,2),
	`ammonia_ppm` decimal(8,4),
	`nitrite_ppm` decimal(8,4),
	`nitrate_ppm` decimal(8,4),
	`turbidity_ntu` decimal(8,2),
	`salinity_ppt` decimal(6,2),
	`water_quality_index` decimal(5,2),
	`status` varchar(20) DEFAULT 'NORMAL',
	`alerts` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aqua_water_quality_log_id` PRIMARY KEY(`log_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_cost_summary` (
	`summary_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`opening_wip_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`material_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`labor_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`machine_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`overhead_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`total_batch_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`actual_output_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`unit_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`finalized_at` timestamp,
	CONSTRAINT `batch_cost_summary_summary_id` PRIMARY KEY(`summary_id`),
	CONSTRAINT `batch_cost_summary_batch_id_unique` UNIQUE(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_parameter_log` (
	`log_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`parameter_id` varchar(36) NOT NULL,
	`entry_date` date NOT NULL,
	`actual_qty` decimal(18,4),
	`actual_value` text,
	`unit_rate` decimal(18,6),
	`amount` decimal(18,4),
	`expected_qty` decimal(18,4),
	`notes` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batch_parameter_log_log_id` PRIMARY KEY(`log_id`)
);
--> statement-breakpoint
CREATE TABLE `batch_traceability` (
	`trace_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`parent_batch_id` varchar(36),
	`origin_farm_id` varchar(36),
	`origin_shed_id` varchar(36),
	`feed_batch_no` varchar(100),
	`medicine_batch_no` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `batch_traceability_trace_id` PRIMARY KEY(`trace_id`)
);
--> statement-breakpoint
CREATE TABLE `biological_asset_cost` (
	`asset_cost_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`poultry_batch_id` varchar(36) NOT NULL,
	`acquisition_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`feed_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`medicine_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`labor_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`overhead_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`mortality_loss_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`net_asset_value` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`current_bird_count` int NOT NULL DEFAULT 0,
	`cost_per_bird` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `biological_asset_cost_asset_cost_id` PRIMARY KEY(`asset_cost_id`)
);
--> statement-breakpoint
CREATE TABLE `bor_ingredient_line` (
	`line_id` varchar(36) NOT NULL,
	`bor_id` varchar(36) NOT NULL,
	`line_no` int NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`std_qty` decimal(18,4) NOT NULL,
	`uom_id` varchar(36),
	`pct_of_output` decimal(8,4),
	`std_unit_rate` decimal(18,6),
	`std_amount` decimal(18,4),
	`is_active` boolean DEFAULT true,
	CONSTRAINT `bor_ingredient_line_line_id` PRIMARY KEY(`line_id`)
);
--> statement-breakpoint
CREATE TABLE `bor_master` (
	`bor_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`bor_code` varchar(100) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`bor_name` varchar(200) NOT NULL,
	`output_item_id` varchar(36),
	`output_qty` decimal(18,4) NOT NULL,
	`output_uom_id` varchar(36),
	`is_active` boolean DEFAULT true,
	`approved_by` varchar(36),
	`approved_at` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bor_master_bor_id` PRIMARY KEY(`bor_id`)
);
--> statement-breakpoint
CREATE TABLE `bor_nutritional_profile` (
	`profile_id` varchar(36) NOT NULL,
	`bor_id` varchar(36) NOT NULL,
	`crude_protein_pct` decimal(6,3),
	`crude_fat_pct` decimal(6,3),
	`crude_fibre_pct` decimal(6,3),
	`moisture_pct` decimal(6,3),
	`ash_pct` decimal(6,3),
	`metabolisable_energy_kcal_kg` decimal(10,2),
	`calcium_pct` decimal(6,3),
	`phosphorus_pct` decimal(6,3),
	`calculated_at` timestamp DEFAULT (now()),
	CONSTRAINT `bor_nutritional_profile_profile_id` PRIMARY KEY(`profile_id`)
);
--> statement-breakpoint
CREATE TABLE `costing_component` (
	`component_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`component_code` varchar(50) NOT NULL,
	`component_name` varchar(100) NOT NULL,
	`cost_type` varchar(30) NOT NULL DEFAULT 'DIRECT_MATERIAL',
	`gl_account_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costing_component_component_id` PRIMARY KEY(`component_id`)
);
--> statement-breakpoint
CREATE TABLE `costing_profile` (
	`profile_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`item_id` varchar(36),
	`item_category_id` varchar(36),
	`costing_method` varchar(30) NOT NULL DEFAULT 'FIFO',
	`standard_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`effective_from` date NOT NULL,
	`effective_to` date,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costing_profile_profile_id` PRIMARY KEY(`profile_id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard` (
	`dashboard_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`dashboard_name` varchar(100) NOT NULL,
	`dashboard_type` varchar(30) NOT NULL DEFAULT 'EXECUTIVE',
	`owner_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dashboard_dashboard_id` PRIMARY KEY(`dashboard_id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard_widget` (
	`widget_id` varchar(36) NOT NULL,
	`dashboard_id` varchar(36) NOT NULL,
	`widget_title` varchar(100) NOT NULL,
	`widget_type` varchar(30) NOT NULL DEFAULT 'CARD',
	`report_id` varchar(36),
	`layout_json` json,
	CONSTRAINT `dashboard_widget_widget_id` PRIMARY KEY(`widget_id`)
);
--> statement-breakpoint
CREATE TABLE `egg_grading_batch` (
	`grading_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`source_batch_id` varchar(36),
	`source_egg_production_id` varchar(36),
	`grading_date` date NOT NULL,
	`total_eggs_input` decimal(12,0) NOT NULL,
	`grade_xl_qty` decimal(12,0) DEFAULT '0',
	`grade_l_qty` decimal(12,0) DEFAULT '0',
	`grade_m_qty` decimal(12,0) DEFAULT '0',
	`grade_s_qty` decimal(12,0) DEFAULT '0',
	`grade_reject_qty` decimal(12,0) DEFAULT '0',
	`graded_by` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `egg_grading_batch_grading_id` PRIMARY KEY(`grading_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_batch_stage` (
	`stage_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`mo_id` varchar(36),
	`stage_name` varchar(30) NOT NULL,
	`stage_seq` int NOT NULL,
	`status` varchar(20) DEFAULT 'PENDING',
	`started_at` timestamp,
	`completed_at` timestamp,
	`duration_minutes` int,
	`machine_id` varchar(36),
	`operator` varchar(200),
	`input_qty_mt` decimal(12,2),
	`output_qty_mt` decimal(12,2),
	`stage_loss_pct` decimal(6,2),
	`remarks` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_batch_stage_stage_id` PRIMARY KEY(`stage_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_cost_breakdown` (
	`breakdown_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`mo_id` varchar(36),
	`ingredient_cost` decimal(18,4),
	`overhead_cost` decimal(14,4),
	`labour_cost` decimal(14,4),
	`energy_cost` decimal(14,4),
	`packaging_cost` decimal(14,4),
	`total_cost` decimal(18,4),
	`produced_qty_mt` decimal(12,2),
	`cost_per_mt` decimal(12,4),
	`cost_per_kg` decimal(10,4),
	`calculated_at` timestamp DEFAULT (now()),
	`notes` text,
	CONSTRAINT `feed_cost_breakdown_breakdown_id` PRIMARY KEY(`breakdown_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_delivery_note` (
	`delivery_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`delivery_no` varchar(100) NOT NULL,
	`delivery_date` date NOT NULL,
	`mo_id` varchar(36),
	`customer_id` varchar(36),
	`farm_id` varchar(36),
	`feed_item_id` varchar(36),
	`qty_mt` decimal(12,2) NOT NULL,
	`unit_price` decimal(14,4),
	`total_value` decimal(18,4),
	`vehicle_no` varchar(50),
	`driver_name` varchar(200),
	`inventory_gi_id` varchar(36),
	`status` varchar(20) DEFAULT 'PENDING',
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_delivery_note_delivery_id` PRIMARY KEY(`delivery_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_formula_version` (
	`version_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`bor_id` varchar(36),
	`version_no` int NOT NULL,
	`effective_from` date NOT NULL,
	`effective_to` date,
	`change_reason` text,
	`approved_by` varchar(36),
	`approved_at` timestamp,
	`status` varchar(20) DEFAULT 'DRAFT',
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_formula_version_version_id` PRIMARY KEY(`version_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_ingredient_inventory` (
	`inv_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`item_id` varchar(36),
	`warehouse_id` varchar(36),
	`qty_on_hand_mt` decimal(14,2) NOT NULL DEFAULT '0.00',
	`reorder_point_mt` decimal(12,2),
	`last_receipt_date` date,
	`last_issue_date` date,
	`last_price_per_mt` decimal(14,4),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_ingredient_inventory_inv_id` PRIMARY KEY(`inv_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_ingredient_price` (
	`price_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`item_id` varchar(36),
	`effective_date` date NOT NULL,
	`price_per_mt` decimal(14,4) NOT NULL,
	`currency` varchar(10) DEFAULT 'INR',
	`source` varchar(100),
	`supplier_id` varchar(36),
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_ingredient_price_price_id` PRIMARY KEY(`price_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_kpi_snapshot` (
	`snapshot_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`period_date` date NOT NULL,
	`total_mos` int,
	`completed_mos` int,
	`avg_batch_efficiency_pct` decimal(6,2),
	`avg_qc_pass_rate_pct` decimal(6,2),
	`total_feed_produced_mt` decimal(14,2),
	`avg_cost_per_mt` decimal(12,4),
	`total_deliveries` int,
	`total_returns` int,
	`return_rate_pct` decimal(6,2),
	`calculated_at` timestamp DEFAULT (now()),
	CONSTRAINT `feed_kpi_snapshot_snapshot_id` PRIMARY KEY(`snapshot_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_manufacturing_order` (
	`mo_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`mo_no` varchar(100) NOT NULL,
	`bor_id` varchar(36),
	`formula_version_id` varchar(36),
	`planned_qty_mt` decimal(14,2) NOT NULL,
	`actual_qty_mt` decimal(14,2),
	`uom_id` varchar(36),
	`planned_start_date` date,
	`planned_end_date` date,
	`actual_start_date` date,
	`actual_end_date` date,
	`target_warehouse_id` varchar(36),
	`priority` varchar(10) DEFAULT 'NORMAL',
	`current_stage` varchar(30) DEFAULT 'CREATED',
	`mo_status` varchar(20) DEFAULT 'OPEN',
	`production_batch_id` varchar(36),
	`notes` text,
	`created_by` varchar(36),
	`approved_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_manufacturing_order_mo_id` PRIMARY KEY(`mo_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_production_batch` (
	`fp_batch_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`fp_batch_code` varchar(100) NOT NULL,
	`bor_id` varchar(36) NOT NULL,
	`planned_output_qty` decimal(18,4) NOT NULL,
	`actual_output_qty` decimal(18,4),
	`output_item_id` varchar(36),
	`batch_status` varchar(20) DEFAULT 'PLANNED',
	`total_ingredient_cost` decimal(18,4) DEFAULT '0',
	`total_resource_cost` decimal(18,4) DEFAULT '0',
	`total_overhead_cost` decimal(18,4) DEFAULT '0',
	`total_cost` decimal(18,4) DEFAULT '0',
	`unit_cost` decimal(18,6),
	`usage_variance_amount` decimal(18,4),
	`production_date` date,
	`location_id` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_production_batch_fp_batch_id` PRIMARY KEY(`fp_batch_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_production_batch_input` (
	`input_id` varchar(36) NOT NULL,
	`fp_batch_id` varchar(36) NOT NULL,
	`bor_line_id` varchar(36),
	`item_id` varchar(36) NOT NULL,
	`std_qty` decimal(18,4),
	`actual_qty` decimal(18,4) NOT NULL,
	`uom_id` varchar(36),
	`unit_rate` decimal(18,6),
	`amount` decimal(18,4),
	`usage_variance` decimal(18,4),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_production_batch_input_input_id` PRIMARY KEY(`input_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_qc_inspection` (
	`inspection_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`mo_id` varchar(36),
	`inspection_date` date NOT NULL,
	`moisture_pct` decimal(6,2),
	`protein_pct` decimal(6,2),
	`fat_pct` decimal(6,2),
	`fiber_pct` decimal(6,2),
	`ash_pct` decimal(6,2),
	`bulk_density_kg_m3` decimal(8,2),
	`pellet_durability_pct` decimal(6,2),
	`aflatoxin_ppb` decimal(8,4),
	`qc_result` varchar(20) NOT NULL,
	`rejection_reason` text,
	`disposition` varchar(30),
	`inspector` varchar(200),
	`lab_report_no` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_qc_inspection_inspection_id` PRIMARY KEY(`inspection_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_return_note` (
	`return_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`delivery_id` varchar(36),
	`return_date` date NOT NULL,
	`qty_returned_mt` decimal(12,2) NOT NULL,
	`reason` varchar(300) NOT NULL,
	`condition` varchar(20) DEFAULT 'DAMAGED',
	`disposal` varchar(30),
	`inventory_gr_id` varchar(36),
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_return_note_return_id` PRIMARY KEY(`return_id`)
);
--> statement-breakpoint
CREATE TABLE `feed_schedule` (
	`feed_schedule_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`feed_formula_id` varchar(36),
	`scheduled_qty` decimal(18,4) NOT NULL,
	`scheduled_time` varchar(20) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'PENDING',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feed_schedule_feed_schedule_id` PRIMARY KEY(`feed_schedule_id`)
);
--> statement-breakpoint
CREATE TABLE `insect_batch` (
	`batch_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`batch_code` varchar(100) NOT NULL,
	`lob_id` varchar(36),
	`insect_type` varchar(50),
	`location_id` varchar(36),
	`hive_count` int,
	`hive_cost_per_unit` decimal(18,4),
	`total_setup_cost` decimal(18,4),
	`setup_date` date,
	`batch_status` varchar(20) DEFAULT 'ACTIVE',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insect_batch_batch_id` PRIMARY KEY(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `insect_daily_entry` (
	`entry_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`entry_date` date NOT NULL,
	`entry_type` varchar(30) NOT NULL,
	`item_id` varchar(36),
	`qty` decimal(18,4),
	`uom_id` varchar(36),
	`unit_rate` decimal(18,6),
	`amount` decimal(18,4),
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insect_daily_entry_entry_id` PRIMARY KEY(`entry_id`)
);
--> statement-breakpoint
CREATE TABLE `insect_harvest_record` (
	`harvest_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`harvest_date` date NOT NULL,
	`main_product_item_id` varchar(36),
	`main_qty_kg` decimal(12,3),
	`main_split_pct` decimal(5,2) DEFAULT '95.00',
	`main_unit_cost` decimal(18,6),
	`byproduct_item_id` varchar(36),
	`byproduct_qty_kg` decimal(12,3),
	`byproduct_split_pct` decimal(5,2) DEFAULT '5.00',
	`byproduct_unit_cost` decimal(18,6),
	`moisture_pct` decimal(5,2),
	`qc_result` varchar(20),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insect_harvest_record_harvest_id` PRIMARY KEY(`harvest_id`)
);
--> statement-breakpoint
CREATE TABLE `item_cost_history` (
	`history_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`old_cost` decimal(18,4) NOT NULL,
	`new_cost` decimal(18,4) NOT NULL,
	`change_reason` varchar(255),
	`revaluation_journal_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `item_cost_history_history_id` PRIMARY KEY(`history_id`)
);
--> statement-breakpoint
CREATE TABLE `job_schedule_master` (
	`job_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`company_id` varchar(36),
	`job_name` varchar(100) NOT NULL,
	`cron_expression` varchar(100) NOT NULL,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`last_run_at` timestamp,
	`next_run_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_schedule_master_job_id` PRIMARY KEY(`job_id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_definition` (
	`kpi_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`kpi_code` varchar(50) NOT NULL,
	`kpi_name` varchar(100) NOT NULL,
	`category` varchar(30) NOT NULL DEFAULT 'PRODUCTION',
	`unit_of_measure` varchar(30) NOT NULL DEFAULT 'PCT',
	CONSTRAINT `kpi_definition_kpi_id` PRIMARY KEY(`kpi_id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_result` (
	`result_id` varchar(36) NOT NULL,
	`kpi_id` varchar(36) NOT NULL,
	`evaluated_at` timestamp NOT NULL DEFAULT (now()),
	`metric_value` decimal(18,4) NOT NULL,
	`zone` varchar(10) NOT NULL DEFAULT 'GREEN',
	CONSTRAINT `kpi_result_result_id` PRIMARY KEY(`result_id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_threshold` (
	`threshold_id` varchar(36) NOT NULL,
	`kpi_id` varchar(36) NOT NULL,
	`green_min` decimal(18,4),
	`green_max` decimal(18,4),
	`yellow_min` decimal(18,4),
	`yellow_max` decimal(18,4),
	`red_min` decimal(18,4),
	`red_max` decimal(18,4),
	CONSTRAINT `kpi_threshold_threshold_id` PRIMARY KEY(`threshold_id`)
);
--> statement-breakpoint
CREATE TABLE `livestock_amortisation_schedule` (
	`schedule_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`period_month` int NOT NULL,
	`period_year` int NOT NULL,
	`amortisation_amount` decimal(18,4) NOT NULL,
	`nca_before` decimal(18,4),
	`nca_after` decimal(18,4),
	`is_posted` boolean DEFAULT false,
	`posted_at` timestamp,
	`gl_journal_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `livestock_amortisation_schedule_schedule_id` PRIMARY KEY(`schedule_id`)
);
--> statement-breakpoint
CREATE TABLE `livestock_batch` (
	`batch_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36),
	`batch_code` varchar(100) NOT NULL,
	`lob_id` varchar(36),
	`costing_method` varchar(20) DEFAULT 'BIO_ASSET',
	`opening_qty` decimal(12,2) NOT NULL,
	`current_qty` decimal(12,2),
	`uom_id` varchar(36),
	`item_id` varchar(36),
	`location_id` varchar(36),
	`batch_status` varchar(20) DEFAULT 'ACTIVE',
	`bio_asset_stage` varchar(20),
	`nca_purchase_cost` decimal(18,4),
	`nca_current` decimal(18,4),
	`residual_value` decimal(18,4),
	`useful_life_months` int,
	`monthly_amortisation` decimal(18,4),
	`fair_value_latest` decimal(18,4),
	`placement_date` date,
	`maturity_date` date,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `livestock_batch_batch_id` PRIMARY KEY(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `livestock_daily_entry` (
	`entry_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`entry_date` date NOT NULL,
	`entry_type` varchar(30) NOT NULL,
	`item_id` varchar(36),
	`qty` decimal(18,4),
	`uom_id` varchar(36),
	`unit_rate` decimal(18,6),
	`amount` decimal(18,4),
	`notes` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `livestock_daily_entry_entry_id` PRIMARY KEY(`entry_id`)
);
--> statement-breakpoint
CREATE TABLE `livestock_fair_value_update` (
	`fv_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`update_date` date NOT NULL,
	`fair_value_per_unit` decimal(18,4) NOT NULL,
	`total_fair_value` decimal(18,4),
	`nca_at_date` decimal(18,4),
	`gain_loss_amount` decimal(18,4),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `livestock_fair_value_update_fv_id` PRIMARY KEY(`fv_id`)
);
--> statement-breakpoint
CREATE TABLE `livestock_milk_record` (
	`record_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`record_date` date NOT NULL,
	`litres_produced` decimal(12,3) NOT NULL,
	`unit_rate` decimal(18,6),
	`total_value` decimal(18,4),
	`fat_pct` decimal(5,2),
	`snf_pct` decimal(5,2),
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `livestock_milk_record_record_id` PRIMARY KEY(`record_id`)
);
--> statement-breakpoint
CREATE TABLE `livestock_offspring_record` (
	`record_id` varchar(36) NOT NULL,
	`parent_batch_id` varchar(36) NOT NULL,
	`record_date` date NOT NULL,
	`offspring_type` varchar(50),
	`qty_born` int NOT NULL,
	`qty_alive` int,
	`qty_dead` int DEFAULT 0,
	`avg_birth_weight_kg` decimal(8,3),
	`child_batch_id` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `livestock_offspring_record_record_id` PRIMARY KEY(`record_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_animal` (
	`animal_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`herd_id` varchar(36),
	`ear_tag` varchar(100) NOT NULL,
	`rfid_tag` varchar(100),
	`animal_name` varchar(100),
	`species_id` varchar(36),
	`breed_id` varchar(36),
	`sex` varchar(10) NOT NULL,
	`date_of_birth` date,
	`origin` varchar(30) DEFAULT 'PURCHASED',
	`dam_id` varchar(36),
	`sire_id` varchar(36),
	`purchase_date` date,
	`purchase_cost` decimal(18,4),
	`supplier_id` varchar(36),
	`current_location_id` varchar(36),
	`animal_status` varchar(20) DEFAULT 'ACTIVE',
	`current_weight_kg` decimal(10,2),
	`last_weighed_at` date,
	`lactation_no` int DEFAULT 0,
	`pregnancy_status` varchar(20) DEFAULT 'NOT_PREGNANT',
	`notes` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `lvs_animal_animal_id` PRIMARY KEY(`animal_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_animal_group` (
	`group_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`herd_id` varchar(36),
	`group_code` varchar(100) NOT NULL,
	`group_name` varchar(200) NOT NULL,
	`group_type` varchar(50),
	`animal_count` int DEFAULT 0,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_animal_group_group_id` PRIMARY KEY(`group_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_animal_purchase` (
	`purchase_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`purchase_no` varchar(100) NOT NULL,
	`purchase_date` date NOT NULL,
	`supplier_id` varchar(36),
	`herd_id` varchar(36),
	`species_id` varchar(36),
	`qty_purchased` int NOT NULL,
	`avg_weight_kg` decimal(10,2),
	`unit_cost` decimal(18,4) NOT NULL,
	`total_cost` decimal(18,4) NOT NULL,
	`transport_cost` decimal(12,4),
	`quarantine_days` int DEFAULT 0,
	`quarantine_end_date` date,
	`inventory_gr_id` varchar(36),
	`status` varchar(20) DEFAULT 'PENDING',
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_animal_purchase_purchase_id` PRIMARY KEY(`purchase_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_animal_sale` (
	`sale_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`sale_no` varchar(100) NOT NULL,
	`sale_date` date NOT NULL,
	`customer_id` varchar(36),
	`sale_type` varchar(30) NOT NULL,
	`qty_sold` int NOT NULL,
	`avg_weight_kg` decimal(10,2),
	`unit_price` decimal(18,4) NOT NULL,
	`total_revenue` decimal(18,4) NOT NULL,
	`transport_cost` decimal(12,4),
	`inventory_gi_id` varchar(36),
	`payment_status` varchar(20) DEFAULT 'PENDING',
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_animal_sale_sale_id` PRIMARY KEY(`sale_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_breeding_record` (
	`breeding_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`dam_animal_id` varchar(36) NOT NULL,
	`breeding_date` date NOT NULL,
	`method` varchar(20) NOT NULL,
	`sire_animal_id` varchar(36),
	`sire_code` varchar(100),
	`sire_breed` varchar(100),
	`technician` varchar(200),
	`pd_date` date,
	`pd_result` varchar(30),
	`expected_calving_date` date,
	`outcome` varchar(30) DEFAULT 'PENDING',
	`cost` decimal(10,4),
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_breeding_record_breeding_id` PRIMARY KEY(`breeding_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_calving_record` (
	`calving_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`breeding_id` varchar(36),
	`dam_animal_id` varchar(36),
	`calving_date` date NOT NULL,
	`calving_ease` varchar(20) DEFAULT 'NORMAL',
	`calves_born` int NOT NULL DEFAULT 1,
	`calves_alive` int NOT NULL DEFAULT 1,
	`calves_dead` int DEFAULT 0,
	`avg_birth_weight_kg` decimal(8,2),
	`dam_condition_post` varchar(30),
	`lactation_start_date` date,
	`notes` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_calving_record_calving_id` PRIMARY KEY(`calving_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_grazing_schedule` (
	`grazing_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`herd_id` varchar(36),
	`field_name` varchar(200) NOT NULL,
	`location_id` varchar(36),
	`from_date` date NOT NULL,
	`to_date` date,
	`area_acres` decimal(10,2),
	`estimated_biomass_kg` decimal(12,2),
	`actual_consumption_kg` decimal(12,2),
	`status` varchar(20) DEFAULT 'PLANNED',
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_grazing_schedule_grazing_id` PRIMARY KEY(`grazing_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_herd` (
	`herd_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`farm_id` varchar(36),
	`herd_code` varchar(100) NOT NULL,
	`herd_name` varchar(200) NOT NULL,
	`herd_type` varchar(50) NOT NULL,
	`species_id` varchar(36),
	`location_id` varchar(36),
	`target_size` int,
	`current_size` int DEFAULT 0,
	`herd_status` varchar(20) DEFAULT 'ACTIVE',
	`manager_name` varchar(200),
	`notes` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `lvs_herd_herd_id` PRIMARY KEY(`herd_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_kpi_snapshot` (
	`snapshot_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`herd_id` varchar(36),
	`period_date` date NOT NULL,
	`herd_size` int,
	`mortality_count` int,
	`mortality_pct` decimal(6,2),
	`avg_daily_gain_kg` decimal(8,4),
	`total_milk_litres` decimal(14,2),
	`avg_milk_per_cow` decimal(10,2),
	`conceptions_this_period` int,
	`calvings_this_period` int,
	`calving_rate_pct` decimal(6,2),
	`total_feed_cost` decimal(18,4),
	`feed_cost_per_litre` decimal(10,4),
	`calculated_at` timestamp DEFAULT (now()),
	CONSTRAINT `lvs_kpi_snapshot_snapshot_id` PRIMARY KEY(`snapshot_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_milk_production` (
	`record_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`animal_id` varchar(36),
	`group_id` varchar(36),
	`record_date` date NOT NULL,
	`session` varchar(20) DEFAULT 'AM',
	`litres` decimal(10,2) NOT NULL,
	`fat_pct` decimal(5,2),
	`snf_pct` decimal(5,2),
	`protein_pct` decimal(5,2),
	`somatic_cell_count` int,
	`milk_quality_grade` varchar(10),
	`lactation_day` int,
	`unit_rate` decimal(10,4),
	`total_value` decimal(12,4),
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_milk_production_record_id` PRIMARY KEY(`record_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_mortality_record` (
	`mortality_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`animal_id` varchar(36),
	`herd_id` varchar(36),
	`death_date` date NOT NULL,
	`cause_of_death` varchar(300) NOT NULL,
	`disease_id` varchar(36),
	`weight_at_death_kg` decimal(10,2),
	`book_value` decimal(18,4),
	`salvage_value` decimal(18,4),
	`disposal_method` varchar(50),
	`insured` boolean DEFAULT false,
	`insurance_claim_no` varchar(100),
	`vet_certified` boolean DEFAULT false,
	`reported_to` varchar(100),
	`recorded_by` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_mortality_record_mortality_id` PRIMARY KEY(`mortality_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_movement_record` (
	`movement_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`animal_id` varchar(36),
	`movement_date` date NOT NULL,
	`from_location_id` varchar(36),
	`to_location_id` varchar(36),
	`from_herd_id` varchar(36),
	`to_herd_id` varchar(36),
	`reason` varchar(30) NOT NULL,
	`transport_method` varchar(50),
	`movement_weight_kg` decimal(10,2),
	`approved_by` varchar(36),
	`notes` text,
	`recorded_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_movement_record_movement_id` PRIMARY KEY(`movement_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_treatment_record` (
	`treatment_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`animal_id` varchar(36),
	`herd_id` varchar(36),
	`treatment_date` date NOT NULL,
	`diagnosis` varchar(500),
	`disease_id` varchar(36),
	`medicine_id` varchar(36),
	`dosage` varchar(100),
	`route` varchar(30),
	`duration_days` int,
	`withdrawal_period_days` int,
	`safe_to_milk_date` date,
	`treatment_cost` decimal(12,4),
	`outcome` varchar(30),
	`vet_name` varchar(200),
	`recorded_by` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_treatment_record_treatment_id` PRIMARY KEY(`treatment_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_vaccination_record` (
	`vaccination_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`animal_id` varchar(36),
	`herd_id` varchar(36),
	`vaccine_name` varchar(200) NOT NULL,
	`medicine_id` varchar(36),
	`disease_id` varchar(36),
	`vaccination_date` date NOT NULL,
	`dose_ml` decimal(8,2),
	`route` varchar(30),
	`batch_no` varchar(100),
	`expiry_date` date,
	`next_due_date` date,
	`vet_name` varchar(200),
	`cost_per_dose` decimal(10,4),
	`recorded_by` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_vaccination_record_vaccination_id` PRIMARY KEY(`vaccination_id`)
);
--> statement-breakpoint
CREATE TABLE `lvs_weight_record` (
	`weight_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`animal_id` varchar(36),
	`herd_id` varchar(36),
	`weigh_date` date NOT NULL,
	`weight_kg` decimal(10,2) NOT NULL,
	`age_days` int,
	`body_condition_score` decimal(4,1),
	`method` varchar(30) DEFAULT 'SCALE',
	`recorded_by` varchar(36),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lvs_weight_record_weight_id` PRIMARY KEY(`weight_id`)
);
--> statement-breakpoint
CREATE TABLE `mortality_record` (
	`mortality_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`record_date` timestamp NOT NULL DEFAULT (now()),
	`mortality_count` int NOT NULL,
	`cull_count` int NOT NULL DEFAULT 0,
	`disease_id` varchar(36),
	`reason` varchar(255),
	`cost_impact` decimal(18,4) DEFAULT '0.0000',
	CONSTRAINT `mortality_record_mortality_id` PRIMARY KEY(`mortality_id`)
);
--> statement-breakpoint
CREATE TABLE `notification_history` (
	`notification_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`channel` varchar(30) NOT NULL DEFAULT 'IN_APP',
	`title` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`is_read` boolean NOT NULL DEFAULT false,
	`dispatched_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_history_notification_id` PRIMARY KEY(`notification_id`)
);
--> statement-breakpoint
CREATE TABLE `parameter_master` (
	`parameter_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`nob_id` varchar(36),
	`lob_id` varchar(36),
	`parameter_code` varchar(50) NOT NULL,
	`parameter_name` varchar(200) NOT NULL,
	`parameter_type` varchar(30) NOT NULL,
	`entry_type_code` varchar(30),
	`item_id` varchar(36),
	`default_uom` varchar(20),
	`qty_method` varchar(20) DEFAULT 'MANUAL',
	`default_qty_per_unit` decimal(18,8),
	`default_qty_per_batch` decimal(18,4),
	`qty_formula` text,
	`description` text,
	`is_mandatory` boolean DEFAULT false,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parameter_master_parameter_id` PRIMARY KEY(`parameter_id`)
);
--> statement-breakpoint
CREATE TABLE `poultry_batch` (
	`poultry_batch_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`farm_id` varchar(36) NOT NULL,
	`shed_id` varchar(36) NOT NULL,
	`production_batch_id` varchar(36) NOT NULL,
	`batch_type` varchar(30) NOT NULL,
	`breed_id` varchar(36),
	`species_id` varchar(36),
	`placement_date` date NOT NULL,
	`initial_bird_count` int NOT NULL,
	`current_bird_count` int NOT NULL,
	`total_mortality` int NOT NULL DEFAULT 0,
	`status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `poultry_batch_poultry_batch_id` PRIMARY KEY(`poultry_batch_id`),
	CONSTRAINT `poultry_batch_production_batch_id_unique` UNIQUE(`production_batch_id`)
);
--> statement-breakpoint
CREATE TABLE `poultry_daily_entry` (
	`entry_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`farm_id` varchar(36) NOT NULL,
	`shed_id` varchar(36) NOT NULL,
	`poultry_batch_id` varchar(36) NOT NULL,
	`entry_date` date NOT NULL,
	`feed_item_id` varchar(36),
	`feed_consumed_kg` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`water_consumed_liters` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`mortality_count` int NOT NULL DEFAULT 0,
	`culling_count` int NOT NULL DEFAULT 0,
	`avg_weight_grams` decimal(10,2) NOT NULL DEFAULT '0.00',
	`temperature_celsius` decimal(5,2),
	`humidity_pct` decimal(5,2),
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poultry_daily_entry_entry_id` PRIMARY KEY(`entry_id`)
);
--> statement-breakpoint
CREATE TABLE `poultry_egg_production` (
	`egg_log_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`poultry_batch_id` varchar(36) NOT NULL,
	`log_date` date NOT NULL,
	`good_eggs` int NOT NULL DEFAULT 0,
	`cracked_eggs` int NOT NULL DEFAULT 0,
	`dirty_eggs` int NOT NULL DEFAULT 0,
	`double_yolk` int NOT NULL DEFAULT 0,
	`total_eggs` int NOT NULL,
	`hdp_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
	`goods_receipt_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poultry_egg_production_egg_log_id` PRIMARY KEY(`egg_log_id`)
);
--> statement-breakpoint
CREATE TABLE `poultry_hatchery` (
	`hatch_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`poultry_batch_id` varchar(36) NOT NULL,
	`setting_date` date NOT NULL,
	`hatch_date` date,
	`eggs_set_qty` int NOT NULL,
	`candled_fertile_qty` int NOT NULL DEFAULT 0,
	`chicks_hatched_qty` int NOT NULL DEFAULT 0,
	`hatch_loss_qty` int NOT NULL DEFAULT 0,
	`hatchability_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poultry_hatchery_hatch_id` PRIMARY KEY(`hatch_id`)
);
--> statement-breakpoint
CREATE TABLE `poultry_kpi` (
	`kpi_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`poultry_batch_id` varchar(36) NOT NULL,
	`fcr` decimal(5,2) NOT NULL DEFAULT '0.00',
	`livability_pct` decimal(5,2) NOT NULL DEFAULT '100.00',
	`mortality_rate_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
	`hdp_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
	`hatchability_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
	`cost_per_bird` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`cost_per_egg` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`cost_per_kg` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poultry_kpi_kpi_id` PRIMARY KEY(`kpi_id`),
	CONSTRAINT `poultry_kpi_poultry_batch_id_unique` UNIQUE(`poultry_batch_id`)
);
--> statement-breakpoint
CREATE TABLE `poultry_slaughter` (
	`slaughter_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`poultry_batch_id` varchar(36) NOT NULL,
	`slaughter_date` date NOT NULL,
	`live_birds_received` int NOT NULL,
	`total_live_weight_kg` decimal(18,4) NOT NULL,
	`dressed_weight_kg` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`yield_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
	`goods_receipt_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poultry_slaughter_slaughter_id` PRIMARY KEY(`slaughter_id`)
);
--> statement-breakpoint
CREATE TABLE `production_batch` (
	`batch_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`order_id` varchar(36),
	`batch_no` varchar(50) NOT NULL,
	`parent_batch_id` varchar(36),
	`formula_id` varchar(36),
	`farm_id` varchar(36),
	`shed_id` varchar(36),
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`planned_qty` decimal(18,4) NOT NULL,
	`actual_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`scrap_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`status` varchar(30) NOT NULL DEFAULT 'DRAFT',
	`start_time` timestamp,
	`end_time` timestamp,
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `production_batch_batch_id` PRIMARY KEY(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `production_batch_input` (
	`input_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`uom_id` varchar(36) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`lot_id` varchar(36),
	`serial_id` varchar(36),
	`planned_qty` decimal(18,4) NOT NULL,
	`actual_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`unit_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`total_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`goods_issue_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_batch_input_input_id` PRIMARY KEY(`input_id`)
);
--> statement-breakpoint
CREATE TABLE `production_batch_output` (
	`output_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`uom_id` varchar(36) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`lot_id` varchar(36),
	`output_type` varchar(30) NOT NULL DEFAULT 'FINISHED_GOOD',
	`qty` decimal(18,4) NOT NULL,
	`cost_split_pct` decimal(5,2) NOT NULL DEFAULT '100.00',
	`unit_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`total_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`goods_receipt_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_batch_output_output_id` PRIMARY KEY(`output_id`)
);
--> statement-breakpoint
CREATE TABLE `production_cost` (
	`cost_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`total_material_cost` decimal(18,4) NOT NULL,
	`total_resource_cost` decimal(18,4) NOT NULL,
	`total_overhead_cost` decimal(18,4) NOT NULL,
	`total_batch_cost` decimal(18,4) NOT NULL,
	`actual_yield_qty` decimal(18,4) NOT NULL,
	`unit_cost` decimal(18,4) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_cost_cost_id` PRIMARY KEY(`cost_id`),
	CONSTRAINT `production_cost_batch_id_unique` UNIQUE(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `production_daily_entry` (
	`entry_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`entry_date` date NOT NULL,
	`produced_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`consumed_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`mortality_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`scrap_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`downtime_minutes` int NOT NULL DEFAULT 0,
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_daily_entry_entry_id` PRIMARY KEY(`entry_id`)
);
--> statement-breakpoint
CREATE TABLE `production_order` (
	`order_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`order_no` varchar(50) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`planned_qty` decimal(18,4) NOT NULL,
	`actual_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`uom_id` varchar(36) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date,
	`status` varchar(30) NOT NULL DEFAULT 'DRAFT',
	`cost_center_id` varchar(36),
	`dimension_values` json,
	`notes` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `production_order_order_id` PRIMARY KEY(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `production_resource_usage` (
	`usage_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`resource_id` varchar(36) NOT NULL,
	`usage_type` varchar(30) NOT NULL DEFAULT 'LABOR',
	`planned_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
	`actual_hours` decimal(10,2) NOT NULL DEFAULT '0.00',
	`hourly_rate` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`total_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_resource_usage_usage_id` PRIMARY KEY(`usage_id`)
);
--> statement-breakpoint
CREATE TABLE `production_variance` (
	`variance_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`planned_qty` decimal(18,4) NOT NULL,
	`actual_qty` decimal(18,4) NOT NULL,
	`qty_variance` decimal(18,4) NOT NULL,
	`material_cost_variance` decimal(18,4) NOT NULL,
	`labor_variance` decimal(18,4) NOT NULL,
	`total_variance_cost` decimal(18,4) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_variance_variance_id` PRIMARY KEY(`variance_id`),
	CONSTRAINT `production_variance_batch_id_unique` UNIQUE(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `production_wip` (
	`wip_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`material_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`labor_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`machine_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`overhead_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`total_wip_cost` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`completion_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `production_wip_wip_id` PRIMARY KEY(`wip_id`),
	CONSTRAINT `production_wip_batch_id_unique` UNIQUE(`batch_id`)
);
--> statement-breakpoint
CREATE TABLE `qc_inspection_result` (
	`inspection_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`template_id` varchar(36),
	`item_id` varchar(36) NOT NULL,
	`batch_id` varchar(36),
	`lot_number` varchar(100),
	`measured_value` decimal(18,4) NOT NULL,
	`inspection_status` varchar(30) NOT NULL DEFAULT 'PASSED',
	`inspected_by` varchar(36),
	`inspected_at` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `qc_inspection_result_inspection_id` PRIMARY KEY(`inspection_id`)
);
--> statement-breakpoint
CREATE TABLE `qc_parameter_template` (
	`template_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`template_code` varchar(50) NOT NULL,
	`template_name` varchar(100) NOT NULL,
	`item_category_id` varchar(36),
	`min_acceptable_value` decimal(18,4),
	`max_acceptable_value` decimal(18,4),
	`uom_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qc_parameter_template_template_id` PRIMARY KEY(`template_id`)
);
--> statement-breakpoint
CREATE TABLE `qr_barcode_master` (
	`qr_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`qr_code_hash` varchar(100) NOT NULL,
	`barcode_type` varchar(30) NOT NULL DEFAULT 'QR_CODE',
	`entity_type` varchar(30) NOT NULL,
	`entity_id` varchar(36) NOT NULL,
	`payload_json` json,
	`scanned_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `qr_barcode_master_qr_id` PRIMARY KEY(`qr_id`),
	CONSTRAINT `qr_barcode_master_qr_code_hash_unique` UNIQUE(`qr_code_hash`)
);
--> statement-breakpoint
CREATE TABLE `quality_capa` (
	`capa_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`ncr_id` varchar(36) NOT NULL,
	`corrective_action` text NOT NULL,
	`preventive_action` text NOT NULL,
	`assigned_to` varchar(36),
	`status` varchar(30) NOT NULL DEFAULT 'IN_PROGRESS',
	`closed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_capa_capa_id` PRIMARY KEY(`capa_id`)
);
--> statement-breakpoint
CREATE TABLE `quality_inspection` (
	`inspection_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`plan_id` varchar(36),
	`batch_id` varchar(36),
	`lot_number` varchar(100),
	`sample_size` decimal(18,4) NOT NULL DEFAULT '1.0000',
	`overall_result` varchar(30) NOT NULL DEFAULT 'PASSED',
	`inspected_by` varchar(36),
	`inspected_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_inspection_inspection_id` PRIMARY KEY(`inspection_id`)
);
--> statement-breakpoint
CREATE TABLE `quality_non_conformance` (
	`ncr_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`inspection_id` varchar(36),
	`severity` varchar(20) NOT NULL DEFAULT 'MAJOR',
	`description` text NOT NULL,
	`root_cause` text,
	`status` varchar(30) NOT NULL DEFAULT 'OPEN',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_non_conformance_ncr_id` PRIMARY KEY(`ncr_id`)
);
--> statement-breakpoint
CREATE TABLE `quality_parameter` (
	`parameter_id` varchar(36) NOT NULL,
	`plan_id` varchar(36) NOT NULL,
	`parameter_name` varchar(100) NOT NULL,
	`target_value` decimal(18,4),
	`min_value` decimal(18,4),
	`max_value` decimal(18,4),
	`uom_id` varchar(36),
	`is_mandatory` boolean NOT NULL DEFAULT true,
	CONSTRAINT `quality_parameter_parameter_id` PRIMARY KEY(`parameter_id`)
);
--> statement-breakpoint
CREATE TABLE `quality_plan` (
	`plan_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`plan_code` varchar(50) NOT NULL,
	`plan_name` varchar(100) NOT NULL,
	`inspection_type` varchar(30) NOT NULL DEFAULT 'INCOMING',
	`item_id` varchar(36),
	`item_category_id` varchar(36),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quality_plan_plan_id` PRIMARY KEY(`plan_id`)
);
--> statement-breakpoint
CREATE TABLE `quality_result` (
	`result_id` varchar(36) NOT NULL,
	`inspection_id` varchar(36) NOT NULL,
	`parameter_id` varchar(36) NOT NULL,
	`measured_value` decimal(18,4) NOT NULL,
	`pass_fail_status` varchar(10) NOT NULL DEFAULT 'PASS',
	CONSTRAINT `quality_result_result_id` PRIMARY KEY(`result_id`)
);
--> statement-breakpoint
CREATE TABLE `quarantine_hold` (
	`hold_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`inspection_id` varchar(36),
	`item_id` varchar(36) NOT NULL,
	`warehouse_id` varchar(36) NOT NULL,
	`location_id` varchar(36) NOT NULL,
	`hold_qty` decimal(18,4) NOT NULL,
	`hold_reason` varchar(255) NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'ON_HOLD',
	`released_by` varchar(36),
	`released_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quarantine_hold_hold_id` PRIMARY KEY(`hold_id`)
);
--> statement-breakpoint
CREATE TABLE `recall_affected_batch` (
	`affected_id` varchar(36) NOT NULL,
	`recall_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`lot_number` varchar(100),
	`blocked_qty` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`quarantine_hold_id` varchar(36),
	CONSTRAINT `recall_affected_batch_affected_id` PRIMARY KEY(`affected_id`)
);
--> statement-breakpoint
CREATE TABLE `recall_management` (
	`recall_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`recall_number` varchar(50) NOT NULL,
	`reason` varchar(255) NOT NULL,
	`severity` varchar(30) NOT NULL DEFAULT 'CLASS_1_HIGH',
	`status` varchar(30) NOT NULL DEFAULT 'INITIATED',
	`initiated_by` varchar(36),
	`initiated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recall_management_recall_id` PRIMARY KEY(`recall_id`),
	CONSTRAINT `recall_management_recall_number_unique` UNIQUE(`recall_number`)
);
--> statement-breakpoint
CREATE TABLE `report_category` (
	`category_id` varchar(36) NOT NULL,
	`category_code` varchar(50) NOT NULL,
	`category_name` varchar(100) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_category_category_id` PRIMARY KEY(`category_id`),
	CONSTRAINT `report_category_category_code_unique` UNIQUE(`category_code`)
);
--> statement-breakpoint
CREATE TABLE `report_definition` (
	`report_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`report_code` varchar(50) NOT NULL,
	`report_name` varchar(100) NOT NULL,
	`data_source_service` varchar(100) NOT NULL,
	`required_permission` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_definition_report_id` PRIMARY KEY(`report_id`)
);
--> statement-breakpoint
CREATE TABLE `report_execution` (
	`execution_id` varchar(36) NOT NULL,
	`report_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`executed_by` varchar(36),
	`parameters_json` json,
	`execution_duration_ms` int NOT NULL DEFAULT 0,
	`status` varchar(20) NOT NULL DEFAULT 'SUCCESS',
	`executed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_execution_execution_id` PRIMARY KEY(`execution_id`)
);
--> statement-breakpoint
CREATE TABLE `report_export` (
	`export_id` varchar(36) NOT NULL,
	`execution_id` varchar(36) NOT NULL,
	`export_format` varchar(10) NOT NULL DEFAULT 'PDF',
	`file_path` varchar(255) NOT NULL,
	`file_name` varchar(200) NOT NULL,
	`file_size_bytes` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_export_export_id` PRIMARY KEY(`export_id`)
);
--> statement-breakpoint
CREATE TABLE `report_schedule` (
	`schedule_id` varchar(36) NOT NULL,
	`report_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`cron_expression` varchar(100) NOT NULL,
	`export_format` varchar(10) NOT NULL DEFAULT 'PDF',
	`recipient_emails` text NOT NULL,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `report_schedule_schedule_id` PRIMARY KEY(`schedule_id`)
);
--> statement-breakpoint
CREATE TABLE `scheduler_history` (
	`history_id` varchar(36) NOT NULL,
	`job_id` varchar(36) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'SUCCESS',
	`execution_duration_ms` int NOT NULL DEFAULT 0,
	`error_message` text,
	`executed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduler_history_history_id` PRIMARY KEY(`history_id`)
);
--> statement-breakpoint
CREATE TABLE `scheduler_job` (
	`job_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`job_name` varchar(100) NOT NULL,
	`job_group` varchar(50) NOT NULL DEFAULT 'OPERATIONAL',
	`cron_expression` varchar(100) NOT NULL,
	`target_service` varchar(100) NOT NULL,
	`target_method` varchar(100) NOT NULL,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`last_run_at` timestamp,
	`next_run_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduler_job_job_id` PRIMARY KEY(`job_id`)
);
--> statement-breakpoint
CREATE TABLE `slaughter_cost_split_config` (
	`config_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`item_id` varchar(36) NOT NULL,
	`is_main_product` boolean NOT NULL DEFAULT false,
	`cost_split_pct` decimal(5,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slaughter_cost_split_config_config_id` PRIMARY KEY(`config_id`)
);
--> statement-breakpoint
CREATE TABLE `system_parameter` (
	`param_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`company_id` varchar(36),
	`param_key` varchar(100) NOT NULL,
	`param_value` text NOT NULL,
	`data_type` varchar(30) NOT NULL DEFAULT 'STRING',
	`description` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `system_parameter_param_id` PRIMARY KEY(`param_id`),
	CONSTRAINT `system_parameter_param_key_unique` UNIQUE(`param_key`)
);
--> statement-breakpoint
CREATE TABLE `tenant_subscription` (
	`sub_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`plan_code` varchar(30) NOT NULL DEFAULT 'STARTER',
	`feature_flags` json DEFAULT ('{}'),
	`storage_limit_gb` decimal(8,2) DEFAULT '5.00',
	`support_tier` varchar(20) DEFAULT 'STANDARD',
	`sla_uptime_pct` decimal(5,2) DEFAULT '99.50',
	`plan_start_date` date,
	`plan_end_date` date,
	`renewal_auto` boolean DEFAULT true,
	`payment_method` varchar(30),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenant_subscription_sub_id` PRIMARY KEY(`sub_id`)
);
--> statement-breakpoint
CREATE TABLE `traceability_event` (
	`event_id` varchar(36) NOT NULL,
	`trace_id` varchar(36) NOT NULL,
	`event_type` varchar(50) NOT NULL,
	`source_location_id` varchar(36),
	`destination_location_id` varchar(36),
	`event_date` timestamp NOT NULL DEFAULT (now()),
	`event_details` json,
	CONSTRAINT `traceability_event_event_id` PRIMARY KEY(`event_id`)
);
--> statement-breakpoint
CREATE TABLE `vaccination_schedule` (
	`schedule_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`disease_id` varchar(36),
	`medicine_id` varchar(36),
	`due_date` timestamp NOT NULL,
	`assigned_to` varchar(36),
	`status` varchar(30) NOT NULL DEFAULT 'SCHEDULED',
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vaccination_schedule_schedule_id` PRIMARY KEY(`schedule_id`)
);
--> statement-breakpoint
CREATE TABLE `variance_analysis` (
	`analysis_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`usage_variance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`price_variance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`yield_variance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`labor_variance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`overhead_variance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`total_variance` decimal(18,4) NOT NULL DEFAULT '0.0000',
	`posted_journal_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `variance_analysis_analysis_id` PRIMARY KEY(`analysis_id`)
);
--> statement-breakpoint
CREATE TABLE `weight_record` (
	`weight_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`company_id` varchar(36) NOT NULL,
	`batch_id` varchar(36) NOT NULL,
	`record_date` timestamp NOT NULL DEFAULT (now()),
	`sample_count` int NOT NULL DEFAULT 1,
	`average_weight_grams` decimal(18,4) NOT NULL,
	`target_weight_grams` decimal(18,4),
	`daily_gain_grams` decimal(18,4),
	CONSTRAINT `weight_record_weight_id` PRIMARY KEY(`weight_id`)
);
--> statement-breakpoint
ALTER TABLE `agri_batch` ADD CONSTRAINT `agri_batch_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_batch` ADD CONSTRAINT `agri_batch_crop_item_id_item_master_item_id_fk` FOREIGN KEY (`crop_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_batch` ADD CONSTRAINT `agri_batch_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_crop_calendar` ADD CONSTRAINT `agri_crop_calendar_plan_id_agri_crop_plan_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `agri_crop_plan`(`plan_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_crop_plan` ADD CONSTRAINT `agri_crop_plan_field_id_agri_field_field_id_fk` FOREIGN KEY (`field_id`) REFERENCES `agri_field`(`field_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_crop_plan` ADD CONSTRAINT `agri_crop_plan_crop_item_id_item_master_item_id_fk` FOREIGN KEY (`crop_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_fertilizer_app` ADD CONSTRAINT `agri_fertilizer_app_field_id_agri_field_field_id_fk` FOREIGN KEY (`field_id`) REFERENCES `agri_field`(`field_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_fertilizer_app` ADD CONSTRAINT `agri_fertilizer_app_plan_id_agri_crop_plan_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `agri_crop_plan`(`plan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_fertilizer_app` ADD CONSTRAINT `agri_fertilizer_app_fertilizer_item_id_item_master_item_id_fk` FOREIGN KEY (`fertilizer_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_field` ADD CONSTRAINT `agri_field_farm_id_farm_master_farm_id_fk` FOREIGN KEY (`farm_id`) REFERENCES `farm_master`(`farm_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_field_input` ADD CONSTRAINT `agri_field_input_batch_id_agri_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `agri_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_field_input` ADD CONSTRAINT `agri_field_input_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_harvest_plan` ADD CONSTRAINT `agri_harvest_plan_plan_id_agri_crop_plan_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `agri_crop_plan`(`plan_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_harvest_record` ADD CONSTRAINT `agri_harvest_record_batch_id_agri_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `agri_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_harvest_record` ADD CONSTRAINT `agri_harvest_record_output_item_id_item_master_item_id_fk` FOREIGN KEY (`output_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_irrigation_log` ADD CONSTRAINT `agri_irrigation_log_field_id_agri_field_field_id_fk` FOREIGN KEY (`field_id`) REFERENCES `agri_field`(`field_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_irrigation_log` ADD CONSTRAINT `agri_irrigation_log_plan_id_agri_crop_plan_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `agri_crop_plan`(`plan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_pesticide_app` ADD CONSTRAINT `agri_pesticide_app_field_id_agri_field_field_id_fk` FOREIGN KEY (`field_id`) REFERENCES `agri_field`(`field_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_pesticide_app` ADD CONSTRAINT `agri_pesticide_app_plan_id_agri_crop_plan_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `agri_crop_plan`(`plan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_pesticide_app` ADD CONSTRAINT `agri_pesticide_app_pesticide_item_id_item_master_item_id_fk` FOREIGN KEY (`pesticide_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_resource_assignment` ADD CONSTRAINT `agri_resource_assignment_plan_id_agri_crop_plan_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `agri_crop_plan`(`plan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_resource_assignment` ADD CONSTRAINT `agri_resource_assignment_activity_id_agri_crop_calendar_activity_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `agri_crop_calendar`(`activity_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_resource_assignment` ADD CONSTRAINT `agri_resource_assignment_field_id_agri_field_field_id_fk` FOREIGN KEY (`field_id`) REFERENCES `agri_field`(`field_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_resource_assignment` ADD CONSTRAINT `agri_resource_assignment_resource_id_resource_master_resource_id_fk` FOREIGN KEY (`resource_id`) REFERENCES `resource_master`(`resource_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_soil_analysis` ADD CONSTRAINT `agri_soil_analysis_field_id_agri_field_field_id_fk` FOREIGN KEY (`field_id`) REFERENCES `agri_field`(`field_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_yield_analysis` ADD CONSTRAINT `agri_yield_analysis_plan_id_agri_crop_plan_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `agri_crop_plan`(`plan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_yield_analysis` ADD CONSTRAINT `agri_yield_analysis_harvest_plan_id_agri_harvest_plan_harvest_plan_id_fk` FOREIGN KEY (`harvest_plan_id`) REFERENCES `agri_harvest_plan`(`harvest_plan_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agri_yield_analysis` ADD CONSTRAINT `agri_yield_analysis_field_id_agri_field_field_id_fk` FOREIGN KEY (`field_id`) REFERENCES `agri_field`(`field_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alert_event` ADD CONSTRAINT `alert_event_rule_id_alert_rule_rule_id_fk` FOREIGN KEY (`rule_id`) REFERENCES `alert_rule`(`rule_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_batch` ADD CONSTRAINT `aqua_batch_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_batch` ADD CONSTRAINT `aqua_batch_species_item_id_item_master_item_id_fk` FOREIGN KEY (`species_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_batch` ADD CONSTRAINT `aqua_batch_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_batch_transfer` ADD CONSTRAINT `aqua_batch_transfer_batch_id_aqua_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `aqua_batch`(`batch_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_batch_transfer` ADD CONSTRAINT `aqua_batch_transfer_from_pond_id_aqua_pond_pond_id_fk` FOREIGN KEY (`from_pond_id`) REFERENCES `aqua_pond`(`pond_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_batch_transfer` ADD CONSTRAINT `aqua_batch_transfer_to_pond_id_aqua_pond_pond_id_fk` FOREIGN KEY (`to_pond_id`) REFERENCES `aqua_pond`(`pond_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_daily_entry` ADD CONSTRAINT `aqua_daily_entry_batch_id_aqua_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `aqua_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_daily_entry` ADD CONSTRAINT `aqua_daily_entry_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_disease_event` ADD CONSTRAINT `aqua_disease_event_pond_id_aqua_pond_pond_id_fk` FOREIGN KEY (`pond_id`) REFERENCES `aqua_pond`(`pond_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_disease_event` ADD CONSTRAINT `aqua_disease_event_batch_id_aqua_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `aqua_batch`(`batch_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_feeding_schedule` ADD CONSTRAINT `aqua_feeding_schedule_pond_id_aqua_pond_pond_id_fk` FOREIGN KEY (`pond_id`) REFERENCES `aqua_pond`(`pond_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_feeding_schedule` ADD CONSTRAINT `aqua_feeding_schedule_batch_id_aqua_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `aqua_batch`(`batch_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_feeding_schedule` ADD CONSTRAINT `aqua_feeding_schedule_feed_item_id_item_master_item_id_fk` FOREIGN KEY (`feed_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_growth_sample` ADD CONSTRAINT `aqua_growth_sample_pond_id_aqua_pond_pond_id_fk` FOREIGN KEY (`pond_id`) REFERENCES `aqua_pond`(`pond_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_growth_sample` ADD CONSTRAINT `aqua_growth_sample_batch_id_aqua_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `aqua_batch`(`batch_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_harvest_record` ADD CONSTRAINT `aqua_harvest_record_batch_id_aqua_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `aqua_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_mortality_event` ADD CONSTRAINT `aqua_mortality_event_pond_id_aqua_pond_pond_id_fk` FOREIGN KEY (`pond_id`) REFERENCES `aqua_pond`(`pond_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_mortality_event` ADD CONSTRAINT `aqua_mortality_event_batch_id_aqua_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `aqua_batch`(`batch_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_pond` ADD CONSTRAINT `aqua_pond_farm_id_farm_master_farm_id_fk` FOREIGN KEY (`farm_id`) REFERENCES `farm_master`(`farm_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_pond` ADD CONSTRAINT `aqua_pond_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_pond_treatment` ADD CONSTRAINT `aqua_pond_treatment_pond_id_aqua_pond_pond_id_fk` FOREIGN KEY (`pond_id`) REFERENCES `aqua_pond`(`pond_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_slaughter_record` ADD CONSTRAINT `aqua_slaughter_record_source_batch_id_aqua_batch_batch_id_fk` FOREIGN KEY (`source_batch_id`) REFERENCES `aqua_batch`(`batch_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_stocking_event` ADD CONSTRAINT `aqua_stocking_event_pond_id_aqua_pond_pond_id_fk` FOREIGN KEY (`pond_id`) REFERENCES `aqua_pond`(`pond_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_stocking_event` ADD CONSTRAINT `aqua_stocking_event_tank_id_aqua_tank_tank_id_fk` FOREIGN KEY (`tank_id`) REFERENCES `aqua_tank`(`tank_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_stocking_event` ADD CONSTRAINT `aqua_stocking_event_batch_id_aqua_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `aqua_batch`(`batch_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_stocking_event` ADD CONSTRAINT `aqua_stocking_event_species_id_species_master_species_id_fk` FOREIGN KEY (`species_id`) REFERENCES `species_master`(`species_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_stocking_event` ADD CONSTRAINT `aqua_stocking_event_supplier_id_supplier_master_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_master`(`supplier_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_tank` ADD CONSTRAINT `aqua_tank_farm_id_farm_master_farm_id_fk` FOREIGN KEY (`farm_id`) REFERENCES `farm_master`(`farm_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_water_quality` ADD CONSTRAINT `aqua_water_quality_pond_id_aqua_pond_pond_id_fk` FOREIGN KEY (`pond_id`) REFERENCES `aqua_pond`(`pond_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_water_quality` ADD CONSTRAINT `aqua_water_quality_tank_id_aqua_tank_tank_id_fk` FOREIGN KEY (`tank_id`) REFERENCES `aqua_tank`(`tank_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aqua_water_quality` ADD CONSTRAINT `aqua_water_quality_batch_id_aqua_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `aqua_batch`(`batch_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_cost_summary` ADD CONSTRAINT `batch_cost_summary_batch_id_production_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `production_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batch_parameter_log` ADD CONSTRAINT `batch_parameter_log_parameter_id_parameter_master_parameter_id_fk` FOREIGN KEY (`parameter_id`) REFERENCES `parameter_master`(`parameter_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `biological_asset_cost` ADD CONSTRAINT `biological_asset_cost_poultry_batch_id_poultry_batch_poultry_batch_id_fk` FOREIGN KEY (`poultry_batch_id`) REFERENCES `poultry_batch`(`poultry_batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bor_ingredient_line` ADD CONSTRAINT `bor_ingredient_line_bor_id_bor_master_bor_id_fk` FOREIGN KEY (`bor_id`) REFERENCES `bor_master`(`bor_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bor_ingredient_line` ADD CONSTRAINT `bor_ingredient_line_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bor_master` ADD CONSTRAINT `bor_master_output_item_id_item_master_item_id_fk` FOREIGN KEY (`output_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bor_nutritional_profile` ADD CONSTRAINT `bor_nutritional_profile_bor_id_bor_master_bor_id_fk` FOREIGN KEY (`bor_id`) REFERENCES `bor_master`(`bor_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `costing_component` ADD CONSTRAINT `costing_component_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `costing_component` ADD CONSTRAINT `costing_component_gl_account_id_gl_account_master_gl_account_id_fk` FOREIGN KEY (`gl_account_id`) REFERENCES `gl_account_master`(`gl_account_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `costing_profile` ADD CONSTRAINT `costing_profile_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dashboard_widget` ADD CONSTRAINT `dashboard_widget_dashboard_id_dashboard_dashboard_id_fk` FOREIGN KEY (`dashboard_id`) REFERENCES `dashboard`(`dashboard_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dashboard_widget` ADD CONSTRAINT `dashboard_widget_report_id_report_definition_report_id_fk` FOREIGN KEY (`report_id`) REFERENCES `report_definition`(`report_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `egg_grading_batch` ADD CONSTRAINT `egg_grading_batch_source_batch_id_poultry_batch_poultry_batch_id_fk` FOREIGN KEY (`source_batch_id`) REFERENCES `poultry_batch`(`poultry_batch_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_batch_stage` ADD CONSTRAINT `feed_batch_stage_mo_id_feed_manufacturing_order_mo_id_fk` FOREIGN KEY (`mo_id`) REFERENCES `feed_manufacturing_order`(`mo_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_batch_stage` ADD CONSTRAINT `feed_batch_stage_machine_id_resource_master_resource_id_fk` FOREIGN KEY (`machine_id`) REFERENCES `resource_master`(`resource_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_cost_breakdown` ADD CONSTRAINT `feed_cost_breakdown_mo_id_feed_manufacturing_order_mo_id_fk` FOREIGN KEY (`mo_id`) REFERENCES `feed_manufacturing_order`(`mo_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_delivery_note` ADD CONSTRAINT `feed_delivery_note_mo_id_feed_manufacturing_order_mo_id_fk` FOREIGN KEY (`mo_id`) REFERENCES `feed_manufacturing_order`(`mo_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_delivery_note` ADD CONSTRAINT `feed_delivery_note_customer_id_customer_master_customer_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customer_master`(`customer_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_delivery_note` ADD CONSTRAINT `feed_delivery_note_farm_id_farm_master_farm_id_fk` FOREIGN KEY (`farm_id`) REFERENCES `farm_master`(`farm_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_delivery_note` ADD CONSTRAINT `feed_delivery_note_feed_item_id_item_master_item_id_fk` FOREIGN KEY (`feed_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_formula_version` ADD CONSTRAINT `feed_formula_version_bor_id_bor_master_bor_id_fk` FOREIGN KEY (`bor_id`) REFERENCES `bor_master`(`bor_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_ingredient_inventory` ADD CONSTRAINT `feed_ingredient_inventory_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_ingredient_inventory` ADD CONSTRAINT `feed_ingredient_inventory_warehouse_id_warehouse_master_warehouse_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_ingredient_price` ADD CONSTRAINT `feed_ingredient_price_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_ingredient_price` ADD CONSTRAINT `feed_ingredient_price_supplier_id_supplier_master_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_master`(`supplier_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_manufacturing_order` ADD CONSTRAINT `feed_manufacturing_order_bor_id_bor_master_bor_id_fk` FOREIGN KEY (`bor_id`) REFERENCES `bor_master`(`bor_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_manufacturing_order` ADD CONSTRAINT `feed_manufacturing_order_formula_version_id_feed_formula_version_version_id_fk` FOREIGN KEY (`formula_version_id`) REFERENCES `feed_formula_version`(`version_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_manufacturing_order` ADD CONSTRAINT `feed_manufacturing_order_target_warehouse_id_warehouse_master_warehouse_id_fk` FOREIGN KEY (`target_warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_production_batch` ADD CONSTRAINT `feed_production_batch_bor_id_bor_master_bor_id_fk` FOREIGN KEY (`bor_id`) REFERENCES `bor_master`(`bor_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_production_batch` ADD CONSTRAINT `feed_production_batch_output_item_id_item_master_item_id_fk` FOREIGN KEY (`output_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_production_batch` ADD CONSTRAINT `feed_production_batch_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_production_batch_input` ADD CONSTRAINT `feed_production_batch_input_fp_batch_id_feed_production_batch_fp_batch_id_fk` FOREIGN KEY (`fp_batch_id`) REFERENCES `feed_production_batch`(`fp_batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_production_batch_input` ADD CONSTRAINT `feed_production_batch_input_bor_line_id_bor_ingredient_line_line_id_fk` FOREIGN KEY (`bor_line_id`) REFERENCES `bor_ingredient_line`(`line_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_production_batch_input` ADD CONSTRAINT `feed_production_batch_input_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_qc_inspection` ADD CONSTRAINT `feed_qc_inspection_mo_id_feed_manufacturing_order_mo_id_fk` FOREIGN KEY (`mo_id`) REFERENCES `feed_manufacturing_order`(`mo_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feed_return_note` ADD CONSTRAINT `feed_return_note_delivery_id_feed_delivery_note_delivery_id_fk` FOREIGN KEY (`delivery_id`) REFERENCES `feed_delivery_note`(`delivery_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insect_batch` ADD CONSTRAINT `insect_batch_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insect_batch` ADD CONSTRAINT `insect_batch_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insect_daily_entry` ADD CONSTRAINT `insect_daily_entry_batch_id_insect_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `insect_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insect_daily_entry` ADD CONSTRAINT `insect_daily_entry_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insect_harvest_record` ADD CONSTRAINT `insect_harvest_record_batch_id_insect_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `insect_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insect_harvest_record` ADD CONSTRAINT `insect_harvest_record_main_product_item_id_item_master_item_id_fk` FOREIGN KEY (`main_product_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `insect_harvest_record` ADD CONSTRAINT `insect_harvest_record_byproduct_item_id_item_master_item_id_fk` FOREIGN KEY (`byproduct_item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `item_cost_history` ADD CONSTRAINT `item_cost_history_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kpi_result` ADD CONSTRAINT `kpi_result_kpi_id_kpi_definition_kpi_id_fk` FOREIGN KEY (`kpi_id`) REFERENCES `kpi_definition`(`kpi_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kpi_threshold` ADD CONSTRAINT `kpi_threshold_kpi_id_kpi_definition_kpi_id_fk` FOREIGN KEY (`kpi_id`) REFERENCES `kpi_definition`(`kpi_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `livestock_amortisation_schedule` ADD CONSTRAINT `livestock_amortisation_schedule_batch_id_livestock_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `livestock_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `livestock_batch` ADD CONSTRAINT `livestock_batch_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `livestock_batch` ADD CONSTRAINT `livestock_batch_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `livestock_batch` ADD CONSTRAINT `livestock_batch_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `livestock_daily_entry` ADD CONSTRAINT `livestock_daily_entry_batch_id_livestock_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `livestock_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `livestock_daily_entry` ADD CONSTRAINT `livestock_daily_entry_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `livestock_fair_value_update` ADD CONSTRAINT `livestock_fair_value_update_batch_id_livestock_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `livestock_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `livestock_milk_record` ADD CONSTRAINT `livestock_milk_record_batch_id_livestock_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `livestock_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `livestock_offspring_record` ADD CONSTRAINT `livestock_offspring_record_parent_batch_id_livestock_batch_batch_id_fk` FOREIGN KEY (`parent_batch_id`) REFERENCES `livestock_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_animal` ADD CONSTRAINT `lvs_animal_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_animal` ADD CONSTRAINT `lvs_animal_species_id_species_master_species_id_fk` FOREIGN KEY (`species_id`) REFERENCES `species_master`(`species_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_animal` ADD CONSTRAINT `lvs_animal_breed_id_breed_master_breed_id_fk` FOREIGN KEY (`breed_id`) REFERENCES `breed_master`(`breed_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_animal` ADD CONSTRAINT `lvs_animal_supplier_id_supplier_master_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_master`(`supplier_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_animal` ADD CONSTRAINT `lvs_animal_current_location_id_location_master_location_id_fk` FOREIGN KEY (`current_location_id`) REFERENCES `location_master`(`location_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_animal_group` ADD CONSTRAINT `lvs_animal_group_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_animal_purchase` ADD CONSTRAINT `lvs_animal_purchase_supplier_id_supplier_master_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_master`(`supplier_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_animal_purchase` ADD CONSTRAINT `lvs_animal_purchase_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_animal_purchase` ADD CONSTRAINT `lvs_animal_purchase_species_id_species_master_species_id_fk` FOREIGN KEY (`species_id`) REFERENCES `species_master`(`species_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_animal_sale` ADD CONSTRAINT `lvs_animal_sale_customer_id_customer_master_customer_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customer_master`(`customer_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_breeding_record` ADD CONSTRAINT `lvs_breeding_record_dam_animal_id_lvs_animal_animal_id_fk` FOREIGN KEY (`dam_animal_id`) REFERENCES `lvs_animal`(`animal_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_breeding_record` ADD CONSTRAINT `lvs_breeding_record_sire_animal_id_lvs_animal_animal_id_fk` FOREIGN KEY (`sire_animal_id`) REFERENCES `lvs_animal`(`animal_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_calving_record` ADD CONSTRAINT `lvs_calving_record_breeding_id_lvs_breeding_record_breeding_id_fk` FOREIGN KEY (`breeding_id`) REFERENCES `lvs_breeding_record`(`breeding_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_calving_record` ADD CONSTRAINT `lvs_calving_record_dam_animal_id_lvs_animal_animal_id_fk` FOREIGN KEY (`dam_animal_id`) REFERENCES `lvs_animal`(`animal_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_grazing_schedule` ADD CONSTRAINT `lvs_grazing_schedule_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_grazing_schedule` ADD CONSTRAINT `lvs_grazing_schedule_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_herd` ADD CONSTRAINT `lvs_herd_farm_id_farm_master_farm_id_fk` FOREIGN KEY (`farm_id`) REFERENCES `farm_master`(`farm_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_herd` ADD CONSTRAINT `lvs_herd_species_id_species_master_species_id_fk` FOREIGN KEY (`species_id`) REFERENCES `species_master`(`species_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_herd` ADD CONSTRAINT `lvs_herd_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_kpi_snapshot` ADD CONSTRAINT `lvs_kpi_snapshot_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_milk_production` ADD CONSTRAINT `lvs_milk_production_animal_id_lvs_animal_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `lvs_animal`(`animal_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_milk_production` ADD CONSTRAINT `lvs_milk_production_group_id_lvs_animal_group_group_id_fk` FOREIGN KEY (`group_id`) REFERENCES `lvs_animal_group`(`group_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_mortality_record` ADD CONSTRAINT `lvs_mortality_record_animal_id_lvs_animal_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `lvs_animal`(`animal_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_mortality_record` ADD CONSTRAINT `lvs_mortality_record_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_mortality_record` ADD CONSTRAINT `lvs_mortality_record_disease_id_disease_master_disease_id_fk` FOREIGN KEY (`disease_id`) REFERENCES `disease_master`(`disease_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_movement_record` ADD CONSTRAINT `lvs_movement_record_animal_id_lvs_animal_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `lvs_animal`(`animal_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_movement_record` ADD CONSTRAINT `lvs_movement_record_from_location_id_location_master_location_id_fk` FOREIGN KEY (`from_location_id`) REFERENCES `location_master`(`location_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_movement_record` ADD CONSTRAINT `lvs_movement_record_to_location_id_location_master_location_id_fk` FOREIGN KEY (`to_location_id`) REFERENCES `location_master`(`location_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_movement_record` ADD CONSTRAINT `lvs_movement_record_from_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`from_herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_movement_record` ADD CONSTRAINT `lvs_movement_record_to_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`to_herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_treatment_record` ADD CONSTRAINT `lvs_treatment_record_animal_id_lvs_animal_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `lvs_animal`(`animal_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_treatment_record` ADD CONSTRAINT `lvs_treatment_record_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_treatment_record` ADD CONSTRAINT `lvs_treatment_record_disease_id_disease_master_disease_id_fk` FOREIGN KEY (`disease_id`) REFERENCES `disease_master`(`disease_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_treatment_record` ADD CONSTRAINT `lvs_treatment_record_medicine_id_medicine_master_medicine_id_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicine_master`(`medicine_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_vaccination_record` ADD CONSTRAINT `lvs_vaccination_record_animal_id_lvs_animal_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `lvs_animal`(`animal_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_vaccination_record` ADD CONSTRAINT `lvs_vaccination_record_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_vaccination_record` ADD CONSTRAINT `lvs_vaccination_record_medicine_id_medicine_master_medicine_id_fk` FOREIGN KEY (`medicine_id`) REFERENCES `medicine_master`(`medicine_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_vaccination_record` ADD CONSTRAINT `lvs_vaccination_record_disease_id_disease_master_disease_id_fk` FOREIGN KEY (`disease_id`) REFERENCES `disease_master`(`disease_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_weight_record` ADD CONSTRAINT `lvs_weight_record_animal_id_lvs_animal_animal_id_fk` FOREIGN KEY (`animal_id`) REFERENCES `lvs_animal`(`animal_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lvs_weight_record` ADD CONSTRAINT `lvs_weight_record_herd_id_lvs_herd_herd_id_fk` FOREIGN KEY (`herd_id`) REFERENCES `lvs_herd`(`herd_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parameter_master` ADD CONSTRAINT `parameter_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parameter_master` ADD CONSTRAINT `parameter_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parameter_master` ADD CONSTRAINT `parameter_master_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poultry_batch` ADD CONSTRAINT `poultry_batch_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poultry_batch` ADD CONSTRAINT `poultry_batch_farm_id_farm_master_farm_id_fk` FOREIGN KEY (`farm_id`) REFERENCES `farm_master`(`farm_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poultry_batch` ADD CONSTRAINT `poultry_batch_shed_id_shed_master_shed_id_fk` FOREIGN KEY (`shed_id`) REFERENCES `shed_master`(`shed_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poultry_batch` ADD CONSTRAINT `poultry_batch_production_batch_id_production_batch_batch_id_fk` FOREIGN KEY (`production_batch_id`) REFERENCES `production_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poultry_daily_entry` ADD CONSTRAINT `poultry_daily_entry_poultry_batch_id_poultry_batch_poultry_batch_id_fk` FOREIGN KEY (`poultry_batch_id`) REFERENCES `poultry_batch`(`poultry_batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poultry_egg_production` ADD CONSTRAINT `poultry_egg_production_poultry_batch_id_poultry_batch_poultry_batch_id_fk` FOREIGN KEY (`poultry_batch_id`) REFERENCES `poultry_batch`(`poultry_batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poultry_hatchery` ADD CONSTRAINT `poultry_hatchery_poultry_batch_id_poultry_batch_poultry_batch_id_fk` FOREIGN KEY (`poultry_batch_id`) REFERENCES `poultry_batch`(`poultry_batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poultry_kpi` ADD CONSTRAINT `poultry_kpi_poultry_batch_id_poultry_batch_poultry_batch_id_fk` FOREIGN KEY (`poultry_batch_id`) REFERENCES `poultry_batch`(`poultry_batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `poultry_slaughter` ADD CONSTRAINT `poultry_slaughter_poultry_batch_id_poultry_batch_poultry_batch_id_fk` FOREIGN KEY (`poultry_batch_id`) REFERENCES `poultry_batch`(`poultry_batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_batch` ADD CONSTRAINT `production_batch_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_batch` ADD CONSTRAINT `production_batch_order_id_production_order_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `production_order`(`order_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_batch_input` ADD CONSTRAINT `production_batch_input_batch_id_production_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `production_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_batch_output` ADD CONSTRAINT `production_batch_output_batch_id_production_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `production_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_cost` ADD CONSTRAINT `production_cost_batch_id_production_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `production_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_daily_entry` ADD CONSTRAINT `production_daily_entry_batch_id_production_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `production_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_order` ADD CONSTRAINT `production_order_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_order` ADD CONSTRAINT `production_order_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_order` ADD CONSTRAINT `production_order_warehouse_id_warehouse_master_warehouse_id_fk` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse_master`(`warehouse_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_order` ADD CONSTRAINT `production_order_location_id_location_master_location_id_fk` FOREIGN KEY (`location_id`) REFERENCES `location_master`(`location_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_order` ADD CONSTRAINT `production_order_uom_id_uom_master_uom_id_fk` FOREIGN KEY (`uom_id`) REFERENCES `uom_master`(`uom_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_resource_usage` ADD CONSTRAINT `production_resource_usage_batch_id_production_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `production_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_variance` ADD CONSTRAINT `production_variance_batch_id_production_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `production_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `production_wip` ADD CONSTRAINT `production_wip_batch_id_production_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `production_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qc_inspection_result` ADD CONSTRAINT `qc_inspection_result_template_id_qc_parameter_template_template_id_fk` FOREIGN KEY (`template_id`) REFERENCES `qc_parameter_template`(`template_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qc_parameter_template` ADD CONSTRAINT `qc_parameter_template_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_capa` ADD CONSTRAINT `quality_capa_ncr_id_quality_non_conformance_ncr_id_fk` FOREIGN KEY (`ncr_id`) REFERENCES `quality_non_conformance`(`ncr_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_inspection` ADD CONSTRAINT `quality_inspection_plan_id_quality_plan_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `quality_plan`(`plan_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_non_conformance` ADD CONSTRAINT `quality_non_conformance_inspection_id_quality_inspection_inspection_id_fk` FOREIGN KEY (`inspection_id`) REFERENCES `quality_inspection`(`inspection_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_parameter` ADD CONSTRAINT `quality_parameter_plan_id_quality_plan_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `quality_plan`(`plan_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_plan` ADD CONSTRAINT `quality_plan_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_result` ADD CONSTRAINT `quality_result_inspection_id_quality_inspection_inspection_id_fk` FOREIGN KEY (`inspection_id`) REFERENCES `quality_inspection`(`inspection_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quality_result` ADD CONSTRAINT `quality_result_parameter_id_quality_parameter_parameter_id_fk` FOREIGN KEY (`parameter_id`) REFERENCES `quality_parameter`(`parameter_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quarantine_hold` ADD CONSTRAINT `quarantine_hold_inspection_id_qc_inspection_result_inspection_id_fk` FOREIGN KEY (`inspection_id`) REFERENCES `qc_inspection_result`(`inspection_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recall_affected_batch` ADD CONSTRAINT `recall_affected_batch_recall_id_recall_management_recall_id_fk` FOREIGN KEY (`recall_id`) REFERENCES `recall_management`(`recall_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recall_affected_batch` ADD CONSTRAINT `recall_affected_batch_quarantine_hold_id_quarantine_hold_hold_id_fk` FOREIGN KEY (`quarantine_hold_id`) REFERENCES `quarantine_hold`(`hold_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_definition` ADD CONSTRAINT `report_definition_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_definition` ADD CONSTRAINT `report_definition_category_id_report_category_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `report_category`(`category_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_execution` ADD CONSTRAINT `report_execution_report_id_report_definition_report_id_fk` FOREIGN KEY (`report_id`) REFERENCES `report_definition`(`report_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_export` ADD CONSTRAINT `report_export_execution_id_report_execution_execution_id_fk` FOREIGN KEY (`execution_id`) REFERENCES `report_execution`(`execution_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `report_schedule` ADD CONSTRAINT `report_schedule_report_id_report_definition_report_id_fk` FOREIGN KEY (`report_id`) REFERENCES `report_definition`(`report_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduler_history` ADD CONSTRAINT `scheduler_history_job_id_scheduler_job_job_id_fk` FOREIGN KEY (`job_id`) REFERENCES `scheduler_job`(`job_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scheduler_job` ADD CONSTRAINT `scheduler_job_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slaughter_cost_split_config` ADD CONSTRAINT `slaughter_cost_split_config_company_id_company_master_company_id_fk` FOREIGN KEY (`company_id`) REFERENCES `company_master`(`company_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slaughter_cost_split_config` ADD CONSTRAINT `slaughter_cost_split_config_item_id_item_master_item_id_fk` FOREIGN KEY (`item_id`) REFERENCES `item_master`(`item_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `traceability_event` ADD CONSTRAINT `traceability_event_trace_id_batch_traceability_trace_id_fk` FOREIGN KEY (`trace_id`) REFERENCES `batch_traceability`(`trace_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `variance_analysis` ADD CONSTRAINT `variance_analysis_batch_id_production_batch_batch_id_fk` FOREIGN KEY (`batch_id`) REFERENCES `production_batch`(`batch_id`) ON DELETE cascade ON UPDATE no action;