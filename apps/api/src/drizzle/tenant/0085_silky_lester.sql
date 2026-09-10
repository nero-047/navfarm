ALTER TABLE `breed_lifecycle_stages` DROP INDEX `uq_breed_lifecycle_stages_scope_code`;--> statement-breakpoint
ALTER TABLE `breed_lifecycle_stages` ADD CONSTRAINT `uq_breed_lifecycle_stages_scope_code` UNIQUE(`tenant_id`,(coalesce(`company_id`, '')),`lifecycle_code`);
