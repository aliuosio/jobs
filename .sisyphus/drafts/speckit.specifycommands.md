SpeckIT Specify Commands

- Bash command to create a new feature and generate its spec (short-name: job-links-selector)
  `.specify/scripts/bash/create-new-feature.sh "Feature: Job Details Links Selector. Description: 'cretae select with a list of job details page links(use dummy. source follows later. set 5 links). the should be under clear indicators in the extension display.' Use GitHub SDD Framework flow. Use SPEC_TEMPLATE at .specify/templates/spec-template.md. Output SPEC_FILE as '/specs/004-job-links-selector/spec.md'." --json --short-name "job-links-selector" "Add 5 dummy links for job details"`

- Expected shell output (example):
  ```json
  {
    "BRANCH_NAME": "004-job-links-selector",
    "SPEC_FILE": "/home/krusty/projects/jobs/specs/004-job-links-selector/spec.md"
  }
  ```

- Note: The actual values will be produced when the command runs. This file records the exact command to execute for traceability.
