# Worktree Loop Protocol

Use worktree isolation for risky or parallel loop attempts. Start with this documentation-first protocol before adding helper automation.

## When To Use

- risky refactors
- competing implementation attempts
- harness proposals
- security remediation
- multi-agent parallel work
- any loop that may touch overlapping files

## Rules

1. One worktree per loop attempt.
2. One branch per maker attempt.
3. The active harness checkout is not edited directly by proposal loops.
4. Checker agents review the patch/diff from the isolated worktree.
5. The loop must produce a patch summary and rollback instructions.
6. Merge or application requires explicit human approval.
7. Abandoned worktrees must be cleaned up.

## Naming

```text
../ocs-loop-<short-goal>
loop/<short-goal>/<timestamp>
```

## Manual Flow

```bash
git worktree add ../ocs-loop-example -b loop/example/$(date +%Y%m%d%H%M%S)
# run maker work inside the worktree
# run checker review against the diff
git -C ../ocs-loop-example diff --stat
git -C ../ocs-loop-example diff
# after approval, apply or merge deliberately
git worktree remove ../ocs-loop-example
```

## Forbidden In Worktree Loops Without Approval

- editing `.opencode/opencode.json`
- editing permission rules
- enabling MCP credentials/connectors
- editing safety constants
- writing to external memory
- pushing or publishing
