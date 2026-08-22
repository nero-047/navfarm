CREATE TABLE `user_session` (
	`session_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`refresh_token_hash` varchar(64) NOT NULL,
	`issued_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`revoked_at` timestamp,
	CONSTRAINT `user_session_session_id` PRIMARY KEY(`session_id`),
	CONSTRAINT `uq_session_token_hash` UNIQUE(`refresh_token_hash`)
);
--> statement-breakpoint
ALTER TABLE `user_session` ADD CONSTRAINT `user_session_user_id_user_master_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_master`(`user_id`) ON DELETE cascade ON UPDATE no action;