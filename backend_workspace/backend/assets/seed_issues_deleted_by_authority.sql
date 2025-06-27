-- CivicSense: Seed deleted issues for authority backend testing

insert into issues (
  id, title, description, created_at, updated_at,
  location, reported_by, isDeleted, deletedBy
) values
  ('test-del-001', 'Test Deleted Issue #1', 'Test issue deleted by authority', now(), now(),
   'POINT(1 1)', 'authority-tester', true, 'authority'),
  ('test-del-002', 'Test Deleted Issue #2', 'Another authority-deleted test', now(), now(),
   'POINT(2 2)', 'authority-tester', true, 'authority');

-- After running, backend /issues/deleted endpoint for an authority account should list these issues.
-- Remove or rollback after test if necessary.
