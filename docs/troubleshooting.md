# Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### Problem: "Not authenticated" errors

**Solutions:**
1. Verify Clerk keys are set correctly in environment variables
2. Check JWT template is configured in Clerk dashboard
3. Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` match
4. Clear browser cookies and try again

#### Problem: User not found in Convex

**Solutions:**
1. Check user sync is working (Clerk webhook)
2. Verify user exists in Convex `users` table
3. Check email matches between Clerk and Convex

### Plaid Integration Issues

#### Problem: "Plaid credentials not configured"

**Solutions:**
1. Set `PLAID_CLIENT_ID` and `PLAID_SECRET` in environment variables
2. Verify `PLAID_ENV` is set (sandbox, development, or production)
3. Check credentials are valid in Plaid dashboard

#### Problem: Link token creation fails

**Solutions:**
1. Verify Plaid credentials are correct
2. Check Plaid environment matches credentials
3. Review Plaid API error messages
4. Ensure user is authenticated

#### Problem: Transactions not syncing

**Solutions:**
1. Check webhook is configured correctly
2. Verify webhook secret matches
3. Check Convex function logs for errors
4. Manually trigger sync from UI
5. Verify institution status is "active"

### Transaction Approval Issues

#### Problem: Entries not appearing in approval queue

**Solutions:**
1. Check `entries_proposed` table has entries with status "pending"
2. Verify user ID matches
3. Check transaction processing completed
4. Review AI entry generation logs

#### Problem: Approval fails silently

**Solutions:**
1. Check browser console for errors
2. Review Convex function logs
3. Verify accounts exist and are accessible
4. Check network connectivity
5. Review error toast notifications

### Performance Issues

#### Problem: Slow page loads

**Solutions:**
1. Check Convex query performance
2. Review database indexes
3. Implement pagination for large lists
4. Add loading states
5. Optimize chart rendering

#### Problem: Approval queue slow with many entries

**Solutions:**
1. Query already limits to 50 entries
2. Consider adding pagination
3. Optimize alternatives fetching
4. Cache account data

### Build and Deployment Issues

#### Problem: TypeScript compilation errors

**Solutions:**
1. Run `npx convex codegen` to regenerate types
2. Check for missing dependencies
3. Verify TypeScript version compatibility
4. Clear `.next` and `node_modules`, reinstall

#### Problem: Convex functions not updating

**Solutions:**
1. Ensure `npx convex dev` is running
2. Check Convex deployment status
3. Verify function syntax is correct
4. Review Convex dashboard for errors

### Webhook Issues

#### Problem: Webhooks not received

**Solutions:**
1. Verify webhook URL is publicly accessible
2. Check SSL certificate is valid
3. Verify webhook secret matches
4. Check provider dashboard for delivery status
5. Review application logs

#### Problem: Webhook signature verification fails

**Solutions:**
1. Verify webhook secret is correct
2. Ensure raw request body is used
3. Check for proxy modifying requests
4. Review webhook handler code

## Debugging Tips

### Enable Debug Logging

Set in environment:
```env
NODE_ENV=development
DEBUG=convex:*
```

### Check Convex Logs

1. Go to Convex dashboard
2. Navigate to Logs
3. Filter by function name
4. Review error messages

### Check Browser Console

1. Open browser DevTools
2. Check Console tab for errors
3. Review Network tab for failed requests
4. Check Application tab for storage issues

### Test Locally

1. Run `npx convex dev` for backend
2. Run `pnpm dev` for frontend
3. Use mock data if Plaid not configured
4. Test with real credentials in sandbox

## Getting Help

1. Check application logs
2. Review Convex dashboard
3. Check browser console
4. Review error messages in UI
5. Consult documentation
6. Check GitHub issues (if applicable)

## Performance Optimization

### Database Queries

- Add indexes for frequently queried fields
- Use pagination for large result sets
- Cache frequently accessed data

### Frontend

- Implement lazy loading
- Optimize bundle size
- Use React.memo for expensive components
- Implement virtual scrolling for long lists

### Backend

- Optimize Convex function execution
- Use actions for external API calls
- Implement retry logic with backoff
- Cache AI explanations
