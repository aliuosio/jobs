# Maintenance: Knowledge Graph Sync & Ghost Node Purge

## Objective
Reconcile the `memory_read_graph` state with the physical file system in the `.specify/` directory.

## Requirements
1. **Crawl Physical Structure**: Identify all active folders and `.md` spec files in the project.
2. **Audit Graph**: Run `memory_read_graph` to retrieve all current entities and relations.
3. **Identify Discrepancies**: 
    - Find entities that point to non-existent file paths.
    - Find "Ghost" relations that link to deleted or moved functions.
4. **Purge**: Use `memory_delete_entities` for every orphaned node.
5. **Re-Map**: Ensure every existing spec file has a `contained_in` relation to its parent folder entity.

## Constraint
- **DO NOT** delete entities representing external dependencies or core architecture unless the file is missing.
- **MUST** confirm the number of deleted nodes in the final observation.