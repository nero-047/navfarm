-- BBP-1 §1.2 defines the location hierarchy as Farm -> House -> Pen -> Silo
-- (step 4's own example code GRS-W2B-SILO1 is farm GRS -> house W2B -> silo
-- 1), so a Silo must be creatable under a Shed/House, not only under a Farm.
-- The seed (system-master-data-seed.ts) has been corrected for newly
-- provisioned tenants; this migration brings existing tenant databases in
-- line.
--
-- This only ADDS 'SHED' to whatever allowed_parent_types list a SILO row
-- already has - it never replaces the list wholesale - so any per-company
-- customisation (extra parent types a tenant may have added to their own
-- SILO type, whether on the shared system row or a company-scoped override)
-- is preserved untouched. The JSON_CONTAINS guard makes this idempotent: a
-- second run finds 'SHED' already present and updates nothing.
UPDATE `location_type_master`
SET `allowed_parent_types` = JSON_ARRAY_APPEND(`allowed_parent_types`, '$', 'SHED')
WHERE `type_code` = 'SILO'
  AND NOT JSON_CONTAINS(`allowed_parent_types`, '"SHED"')
  AND `deleted_at` IS NULL;
