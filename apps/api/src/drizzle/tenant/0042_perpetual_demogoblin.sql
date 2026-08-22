CREATE TABLE `user_notification_pref` (
	`pref_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`category` varchar(50) NOT NULL,
	`email_enabled` boolean NOT NULL DEFAULT true,
	`in_app_enabled` boolean NOT NULL DEFAULT true,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_notification_pref_pref_id` PRIMARY KEY(`pref_id`),
	CONSTRAINT `uq_user_notif_category` UNIQUE(`user_id`,`category`)
);
--> statement-breakpoint
ALTER TABLE `user_notification_pref` ADD CONSTRAINT `user_notification_pref_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master`(`user_id`) ON DELETE cascade ON UPDATE no action;