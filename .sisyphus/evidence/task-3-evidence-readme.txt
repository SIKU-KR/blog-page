# Command: cat .sisyphus/evidence/README.md
# Evidence Capture Conventions

All task evidence must be stored in this directory.

## Naming Standard

Files should follow the pattern: `task-{N}-{slug}.{ext}`

- `{N}`: Task number from the plan.
- `{slug}`: Descriptive name of the evidence.
- `{ext}`: Usually `.txt` for command outputs, or `.png` for screenshots.

Example: `task-3-evidence-list.txt`

## Capture Pattern

When capturing command output, include the command itself at the top.

```bash
# Command: ls -R .sisyphus/evidence
... output ...
```

## Mandatory Evidence

Every task must produce at least one evidence file demonstrating the change or verification.
