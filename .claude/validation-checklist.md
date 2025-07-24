# Documentation Validation Checklist

## 1. Technical Accuracy - Subscription Tiers

### Free Tier Limits
- [ ] **25 pages** - Verify all references show 25 pages (not 50)
- [ ] **25 checkboxes per page** - Confirm checkbox limit is 25/page
- [ ] **2 lists** - Ensure list limit is 2 (not 1)
- [ ] **Price: $0/month** - Verify free tier pricing

### Pro Tier Limits
- [ ] **100 pages** - Confirm page limit is 100
- [ ] **100 checkboxes per page** - Verify checkbox limit is 100/page
- [ ] **10 lists** - Ensure list limit is 10
- [ ] **Price: $6.99/month** - Verify Pro pricing

### Max Tier Limits
- [ ] **500 pages** - Confirm page limit is 500
- [ ] **1000 checkboxes per page** - Verify checkbox limit is 1000/page
- [ ] **25 lists** - Ensure list limit is 25
- [ ] **Price: $19.99/month** - Verify Max pricing

## 2. Consistency Checks

### PostHog Removal
- [ ] No PostHog references in any documentation files
- [ ] No PostHog environment variables mentioned
- [ ] No PostHog initialization code examples
- [ ] No PostHog analytics tracking examples

### Free Tier Consistency
- [ ] All free tier examples use 25 pages (not 50)
- [ ] Error messages reflect 25 page limit
- [ ] UI screenshots/examples show correct limits

### Sidebar Width
- [ ] Sidebar width documented as "20rem" (320px)
- [ ] Code examples use `w-80` or `20rem`
- [ ] No references to old sidebar widths

## 3. New Features Documentation

### Extraction Details Card
- [ ] Component documentation exists
- [ ] Shows checkbox counts correctly
- [ ] Includes loading states
- [ ] Error handling documented

### Loading States
- [ ] Skeleton loaders documented
- [ ] Loading indicators for sync operations
- [ ] Progress indicators for extraction

### Visual Assets
- [ ] Logo references updated
- [ ] Landing page images documented
- [ ] Asset paths correct

### Sync to Notion Improvements
- [ ] New sync features documented
- [ ] Performance improvements noted
- [ ] Error handling enhancements

## 4. Code Examples Validation

### Tier Limit Examples
```typescript
// Verify these values in all examples:
const TIER_LIMITS = {
  free: {
    maxPages: 25,      // NOT 50
    maxCheckboxes: 25,
    maxLists: 2        // NOT 1
  },
  pro: {
    maxPages: 100,
    maxCheckboxes: 100,
    maxLists: 10
  },
  max: {
    maxPages: 500,
    maxCheckboxes: 1000,
    maxLists: 25
  }
}
```

### API Response Examples
- [ ] Error responses show correct tier limits
- [ ] Success responses include proper tier info
- [ ] Rate limiting examples accurate

### UI Component Examples
- [ ] Sidebar width: `className="w-80"` or `style="width: 20rem"`
- [ ] Loading state examples match implementation
- [ ] Error boundary examples current

## 5. File-Specific Checks

### `.claude/features/subscription-tiers.md`
- [ ] All tier limits correct
- [ ] Pricing accurate
- [ ] Implementation examples updated
- [ ] No PostHog references

### `.claude/technical/api-reference.md`
- [ ] API endpoints documented correctly
- [ ] Request/response examples accurate
- [ ] Error codes and messages updated
- [ ] Rate limits reflect tier constraints

### `.claude/technical/ui-components.md`
- [ ] Sidebar component width correct
- [ ] Loading states documented
- [ ] Extraction details card included
- [ ] Component hierarchy accurate

### `.claude/technical/architecture.md`
- [ ] No PostHog in tech stack
- [ ] Tier enforcement logic documented
- [ ] Data flow diagrams accurate
- [ ] System constraints updated

### `.claude/changelog.md`
- [ ] Recent changes documented
- [ ] Breaking changes highlighted
- [ ] Migration notes if needed

## 6. Cross-Reference Validation

### Internal Links
- [ ] All documentation links work
- [ ] No broken references
- [ ] File paths correct

### Code References
- [ ] Component imports accurate
- [ ] API endpoint paths correct
- [ ] Database table names match schema

### Environment Variables
- [ ] No PostHog env vars
- [ ] All required vars documented
- [ ] Example `.env` file updated

## 7. User-Facing Documentation

### Error Messages
- [ ] "Upgrade to add more pages" (not lists)
- [ ] Tier limit messages accurate
- [ ] Helpful upgrade prompts

### UI Text
- [ ] Plan names consistent (Free, Pro, Max)
- [ ] Feature descriptions accurate
- [ ] Pricing displayed correctly

## 8. Test Coverage

### Unit Tests
- [ ] Tier limit tests use correct values
- [ ] Sidebar width tests updated
- [ ] New feature tests documented

### Integration Tests
- [ ] Sync functionality tests current
- [ ] Subscription flow tests accurate
- [ ] API endpoint tests updated

## Validation Process

1. **Automated Checks**
   - Run grep for PostHog references
   - Search for old tier limits (50 pages, 1 list)
   - Verify consistent terminology

2. **Manual Review**
   - Read through each updated file
   - Cross-reference with codebase
   - Check internal consistency

3. **Code Validation**
   - Compare docs with actual implementation
   - Verify API responses match docs
   - Ensure UI matches descriptions

## Sign-off Criteria

- [ ] All checkboxes above completed
- [ ] No PostHog references found
- [ ] Tier limits consistent throughout
- [ ] New features properly documented
- [ ] Code examples tested and working
- [ ] Cross-references validated
- [ ] User-facing text accurate

## Notes for Reviewer

- Pay special attention to Free tier (25 pages, not 50)
- Ensure sidebar width is consistently "20rem"
- Verify all PostHog references are removed
- Check that new features are comprehensively documented