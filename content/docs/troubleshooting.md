---
title: 'Troubleshooting'
icon: 'help-circle'
---

This guide helps you resolve common issues you might encounter while using Checkify.so.

## Connection Issues

### "Cannot connect to Notion"

**Symptoms**: Error when trying to connect Notion account or authorization fails.

**Solutions**:
1. Ensure you're logged into the correct Notion workspace
2. Check that you have member (not guest) access to the workspace
3. Clear your browser cookies and try again
4. Try using a different browser or incognito mode

### "Notion workspace not found"

**Symptoms**: Your workspace doesn't appear in the authorization page.

**Solutions**:
- Verify you're a workspace member, not a guest
- Ask your workspace admin to add you as a member
- Make sure you're logged into Notion with the correct account

## Database Issues

### "Database not showing up"

**Symptoms**: After connecting Notion, your databases don't appear in the selection.

**Solutions**:
1. Wait 1-2 minutes for initial sync to complete
2. Ensure the database is shared with your integration:
   - Open the database in Notion
   - Click "Share" 
   - Add your Checkify integration
3. Refresh the page and search again
4. Check that the database isn't archived

### "No todos found in database"

**Symptoms**: Database connects but shows zero todos.

**Solutions**:
- Verify your Notion pages contain checkbox blocks (not just text)
- Ensure checkboxes are in the page content, not in database properties
- Check that pages aren't filtered out in your database view
- Try creating a test page with checkboxes to verify

## Sync Issues

### "Checkbox changes not syncing"

**Symptoms**: Clicking checkboxes in Checkify doesn't update Notion.

**Solutions**:
1. Check your internet connection
2. Verify the integration still has edit permissions:
   - Go to Notion Settings → My connections
   - Find Checkify and check permissions
3. Try refreshing the todo list
4. Disconnect and reconnect Notion

### "Sync to Notion Database fails"

**Symptoms**: Error when trying to create aggregated database.

**Solutions**:
- Ensure Checkify has permission to create content in your workspace
- Check if you've reached your tier's todo limit
- Try selecting a different parent page or use workspace root
- Wait a moment and retry (may be rate limited)

## Tier Limit Issues

### "Reached page/checkbox limit"

**Symptoms**: Message showing you've hit your tier limits.

**Solutions**:
1. Upgrade to a higher tier for increased limits
2. Remove unused todo lists to free up space
3. Focus on databases with fewer pages
4. Consider splitting large databases

### "Can't create more todo lists"

**Symptoms**: Create button disabled or error when creating new list.

**Solutions**:
- Check your current tier's todo list limit
- Delete unused todo lists
- Upgrade to Pro or Max tier

## Payment Issues

### "Payment failed"

**Symptoms**: Error during checkout or subscription renewal.

**Solutions**:
1. Verify your card details are correct
2. Check with your bank for any blocks
3. Try a different payment method
4. Contact billing@checkify.so for assistance

### "Subscription not activating"

**Symptoms**: Paid but still showing free tier.

**Solutions**:
- Wait 1-2 minutes for processing
- Refresh the page
- Check your email for confirmation
- Sign out and back in

## Performance Issues

### "App is running slowly"

**Symptoms**: Slow loading or unresponsive interface.

**Solutions**:
1. Check your internet connection speed
2. Try a different browser
3. Clear browser cache and cookies
4. Reduce number of todos per page if possible

### "Pages not loading"

**Symptoms**: Blank pages or infinite loading.

**Solutions**:
- Disable browser extensions (especially ad blockers)
- Check if JavaScript is enabled
- Try incognito/private browsing mode
- Update your browser to the latest version

## Account Issues

### "Can't sign in"

**Symptoms**: Login fails or redirects back to login page.

**Solutions**:
1. Ensure you're using the correct Google account
2. Check if cookies are enabled
3. Clear browser data and try again
4. Try a different browser

### "Lost access to Notion databases"

**Symptoms**: Previously connected databases show errors.

**Solutions**:
- Reconnect your Notion account
- Check if someone revoked the integration access
- Verify you still have access to those databases in Notion

## Common Error Messages

### "Rate limit exceeded"
Wait a few minutes before trying again. Notion API has rate limits.

### "Invalid authentication"
Your session expired. Sign out and sign back in.

### "Database access denied"
The integration lost access. Re-share the database in Notion.

### "Network error"
Check your internet connection and try again.

## Getting More Help

If these solutions don't resolve your issue:

1. **Check Status**: Visit status.checkify.so for any ongoing issues
2. **Contact Support**: Email support@checkify.so with:
   - Your account email
   - Description of the issue
   - Steps to reproduce
   - Any error messages
   - Screenshots if helpful

3. **Response Time**: We typically respond within 24 hours on business days

## Preventive Tips

- Keep your browser updated
- Regularly review integration permissions in Notion
- Don't share your account credentials
- Monitor your usage relative to tier limits
- Enable email notifications for important updates