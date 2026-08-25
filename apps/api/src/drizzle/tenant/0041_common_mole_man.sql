ALTER TABLE `batch_transaction` ADD `journal_id` varchar(36);--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD `status` varchar(20) DEFAULT 'POSTED' NOT NULL;--> statement-breakpoint
ALTER TABLE `batch_transaction` ADD `supersedes_transaction_id` varchar(36);--> statement-breakpoint
ALTER TABLE `inventory_ledger` ADD `reversal_of_ledger_id` varchar(36);--> statement-breakpoint
ALTER TABLE `journal_header` ADD `reversal_of_journal_id` varchar(36);