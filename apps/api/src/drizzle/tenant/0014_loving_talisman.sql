ALTER TABLE `farm_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `farm_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `location_master` ADD `farm_id` varchar(36);--> statement-breakpoint
ALTER TABLE `location_master` ADD `shed_id` varchar(36);--> statement-breakpoint
ALTER TABLE `shed_master` ADD `nob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `shed_master` ADD `lob_id` varchar(36);--> statement-breakpoint
ALTER TABLE `farm_master` ADD CONSTRAINT `farm_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `farm_master` ADD CONSTRAINT `farm_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `loc_master_farm_id_fk` FOREIGN KEY (`farm_id`) REFERENCES `farm_master`(`farm_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `location_master` ADD CONSTRAINT `loc_master_shed_id_fk` FOREIGN KEY (`shed_id`) REFERENCES `shed_master`(`shed_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shed_master` ADD CONSTRAINT `shed_master_nob_id_nob_master_nob_id_fk` FOREIGN KEY (`nob_id`) REFERENCES `nob_master`(`nob_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shed_master` ADD CONSTRAINT `shed_master_lob_id_lob_master_lob_id_fk` FOREIGN KEY (`lob_id`) REFERENCES `lob_master`(`lob_id`) ON DELETE restrict ON UPDATE no action;