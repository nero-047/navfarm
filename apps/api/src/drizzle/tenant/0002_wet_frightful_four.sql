ALTER TABLE `user_company_assignments` ADD CONSTRAINT `uq_user_company` UNIQUE(`user_id`,`company_id`);--> statement-breakpoint
INSERT IGNORE INTO `user_company_assignments`
  (`assign_id`, `user_id`, `company_id`, `is_primary`, `is_active`, `assigned_by`)
SELECT UUID(), `user_id`, `company_id`, true, true, `user_id`
FROM `user_master`
WHERE `company_id` IS NOT NULL
  AND `company_id` != '00000000-0000-0000-0000-000000000000';
