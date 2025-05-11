
# Time Services Refactoring

## Overview
This document tracks the ongoing refactoring of the `src/utils/time/services` directory to consolidate overlapping code and improve maintainability.

## Core Functionality
The following core functionality must be preserved throughout the refactoring:

1. **Time Entry Management**
   - Creating, reading, updating, and deleting time entries
   - Querying entries by date, user, and other criteria
   - Calculating total hours

2. **TOIL (Time Off In Lieu) Management**
   - Calculating and tracking TOIL
   - Storing and querying TOIL records
   - TOIL summaries and reporting

3. **Storage Operations**
   - Persisting time entries to localStorage
   - Loading entries from localStorage
   - Managing deleted entries

4. **Event System**
   - Publishing time-related events
   - Subscribing to time-related events

## Changes Made

### Phase 1 - Consolidation (Ongoing)
- Improved `index.ts` exports to provide a cleaner API while maintaining backward compatibility
- Added deprecation notices to legacy components
- Consolidated TOIL exports into a single entry point
- Created documentation for the refactoring process

### Planned Work
- Consolidate operation files (create, update, delete)
- Merge duplicate functionality in storage operations
- Simplify event handling
- Remove redundant re-export files
- Add comprehensive tests

## Test Coverage
- Tests for `timeEntryService.test.ts` cover basic CRUD operations
- Additional tests needed for:
  - TOIL functionality
  - Event handling
  - Edge cases in storage operations

## Known Issues
- Circular dependencies between files
- Overlapping functionality between files
- Inconsistent error handling
