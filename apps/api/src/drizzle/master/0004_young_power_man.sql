CREATE TABLE `user_auth_index` (
	`email` varchar(255) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_auth_index_email` PRIMARY KEY(`email`)
);
--> statement-breakpoint
ALTER TABLE `user_auth_index` ADD CONSTRAINT `user_auth_index_tenant_id_tenant_master_tenant_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenant_master`(`tenant_id`) ON DELETE cascade ON UPDATE no action;