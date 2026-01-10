# Implementation Plans

This directory contains implementation plan files created by the `@planning` agent.

## Naming Convention

Files follow the format: `YYYY-MM-DD-feature-name.md`

Examples:
- `2025-01-09-user-authentication.md`
- `2025-01-10-api-rate-limiting.md`

## File Structure

Each plan contains:
- **YAML Frontmatter**: Metadata (date, title, status, task counts)
- **Summary**: What will be built
- **Research Findings**: Codebase analysis from subagents
- **Implementation Tasks**: Ordered tasks with file paths and patterns
- **Testing Strategy**: How to verify the implementation
- **Progress Log**: Updates as implementation proceeds

## Status Values

- `ready` - Plan complete, awaiting implementation
- `in-progress` - Implementation underway
- `blocked` - Waiting on external input or dependency
- `complete` - All tasks finished

## Usage

1. **Create a plan**: `@planning "Add feature X"`
2. **Review the plan**: Read the generated `.md` file
3. **Execute the plan**: `@implementation .plans/YYYY-MM-DD-feature.md`
4. **Check progress**: Review the Progress Log section

Plans persist across context window resets, enabling long-running work to resume.
