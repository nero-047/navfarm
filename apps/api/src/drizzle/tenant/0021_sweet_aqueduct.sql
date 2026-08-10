ALTER TABLE `batch_header` ADD CONSTRAINT `uq_batch_header_tenant_company_no` UNIQUE(`tenant_id`,`company_id`,`batch_no`);--> statement-breakpoint
ALTER TABLE `goods_issue` ADD CONSTRAINT `uq_goods_issue_tenant_company_no` UNIQUE(`tenant_id`,`company_id`,`issue_no`);--> statement-breakpoint
ALTER TABLE `journal_header` ADD CONSTRAINT `uq_journal_header_tenant_company_no` UNIQUE(`tenant_id`,`company_id`,`journal_no`);--> statement-breakpoint
ALTER TABLE `stock_adjustment` ADD CONSTRAINT `uq_stock_adjustment_tenant_company_no` UNIQUE(`tenant_id`,`company_id`,`adjustment_no`);--> statement-breakpoint
ALTER TABLE `stock_transfer` ADD CONSTRAINT `uq_stock_transfer_tenant_company_no` UNIQUE(`tenant_id`,`company_id`,`transfer_no`);