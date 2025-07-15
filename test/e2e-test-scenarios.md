# E2E Test Scenarios for Pagination

## Test Scenarios

### 1. Small Database Test
- **Setup**: Notion database with 5 pages, 3-5 todos per page
- **Expected**: 
  - All todos load without pagination
  - Extraction info shows complete extraction
  - No errors displayed

### 2. Large Database Test  
- **Setup**: Notion database with 100+ pages, 50+ todos per page
- **Expected**:
  - Pagination kicks in automatically
  - Progress displayed during loading
  - All todos eventually loaded
  - Extraction info shows total pages/todos

### 3. Error Handling Test
- **Setup**: Database with some pages that have permission issues
- **Expected**:
  - Accessible pages load successfully
  - Error count displayed in extraction info
  - Specific error messages shown
  - Partial data still usable

### 4. Performance Test
- **Setup**: Database with 200+ pages
- **Expected**:
  - Initial load time < 5 seconds for first batch
  - No browser freezing
  - Smooth scrolling with many todos
  - Memory usage stays reasonable

### 5. Mixed Content Test
- **Setup**: Database with pages containing:
  - Todo blocks
  - Paragraph blocks
  - Nested blocks
  - Empty pages
- **Expected**:
  - Only todo blocks extracted
  - Empty pages filtered out
  - Nested todos captured correctly

## Manual Testing Steps

1. **Create Test Databases in Notion**:
   ```
   - Small DB: 5 pages, 15-25 total todos
   - Medium DB: 50 pages, 500+ total todos  
   - Large DB: 150+ pages, 2000+ total todos
   - Error DB: Mix of accessible/inaccessible pages
   ```

2. **Test Each Scenario**:
   - Connect the test database
   - Navigate to todo list page
   - Observe loading behavior
   - Check extraction info in sidebar
   - Verify todo counts match
   - Test checkbox interactions

3. **Performance Metrics to Track**:
   - Initial page load time
   - Time to fetch all todos
   - Memory usage (Chrome DevTools)
   - Network requests count
   - Any console errors

4. **Edge Cases to Test**:
   - Database with 0 todos
   - Database with 1 page, 1000+ todos
   - Rapid refresh clicking
   - Network interruption during fetch
   - Switching between databases quickly

## Automated Test Commands

```bash
# Run unit tests
pnpm test:unit test/server/utils/notion-pagination.test.ts

# Run integration tests  
npx tsx test/integration/pagination-integration.test.ts

# Check test coverage
pnpm test:coverage
```

## Expected Behavior Summary

✅ **Success Criteria**:
- All todos from all pages are fetched
- No data loss for databases under 10,000 todos
- Clear feedback when limits are reached
- Graceful error handling
- Performance remains acceptable

❌ **Failure Criteria**:
- Missing todos due to pagination issues
- Browser crashes or freezes
- No feedback on extraction status
- Silent failures without error messages
- Infinite loading states