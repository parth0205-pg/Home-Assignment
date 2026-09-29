# Bug Reports

### Bug 1: Pagination Skips First Page (Off-by-One)
- **Location**: `src/services/taskService.js` inside `getPaginated`
- **Expected**: `page=1&limit=10` should return tasks from index 0 to 9.
- **Actual**: Offset was calculated as `page * limit` (1 * 10 = 10), skipping the first 10 items.
- **Fix**: Updated offset calculation to `(page - 1) * limit`.

### Bug 2: Task Completion Mutates Priority
- **Location**: `src/services/taskService.js` inside `completeTask`
- **Expected**: Completing a task should preserve its original priority.
- **Actual**: `priority: 'medium'` was hardcoded, causing high-priority tasks to be downgraded.
- **Fix**: Removed hardcoded priority to preserve the existing task priority.

### Bug 3: Substring Status Filtering
- **Location**: `src/services/taskService.js` inside `getByStatus`
- **Expected**: `?status=do` should match only exact status values.
- **Actual**: Used `.includes()`, causing `?status=do` to match both `todo` and `done`.
- **Fix**: Replaced `.includes()` with exact equality `===`

### Bug 4: Immutable Fields Overwritten on PUT
- **Location**: `src/services/taskService.js` inside `update`
- **Expected**: System-generated fields `id` and `createdAt` must remain immutable.
- **Actual**: Spreading `fields` directly allowed clients to overwrite IDs and timestamps.
- **Fix**: Excluded `id` and `createdAt` when applying payload updates.
