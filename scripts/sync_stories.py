#!/usr/bin/env python3
"""
BMAD GitHub Bridge

Push stories to GitHub + sync status:
- Push: story.md → GitHub Issue (content)
- Sync: GitHub → story.md (status only)

Usage:
    python scripts/sync_stories.py --list
    python scripts/sync_stories.py --push 001
    python scripts/sync_stories.py --status 001
    python scripts/sync_stories.py --sync-all
"""

import argparse
import re
from dataclasses import dataclass
from pathlib import Path


GITHUB_REPO = "aliuosio/jobs"


@dataclass
class Story:
    path: Path
    story_id: str
    title: str
    github_issue: str = ""
    github_status: str = ""
    github_labels: str = ""
    epic_id: str = ""
    priority: str = "medium"
    story_points: int = 2
    sprint: str = ""
    content: str = ""


def find_stories(path: str = ".") -> list[Story]:
    stories = []
    search_path = Path(path)

    for pattern in ["**/*.story.md", "**/stories/**/*.md", "**/specs/**/story.md"]:
        for file_path in search_path.glob(pattern):
            story = parse_story_file(file_path)
            if story:
                stories.append(story)

    return sorted(stories, key=lambda s: s.story_id)


def parse_story_file(file_path: Path) -> Story:
    content = file_path.read_text()

    story_id = file_path.stem
    title = extract_field(content, "title") or story_id
    github_issue = extract_field(content, "github_issue") or ""
    github_status = extract_field(content, "github_status") or ""
    github_labels = extract_field(content, "github_labels") or ""
    epic_id = extract_field(content, "epic_id") or ""
    priority = extract_field(content, "priority") or "medium"
    story_points = int(extract_field(content, "story_points") or "2")
    sprint = extract_field(content, "sprint") or ""

    return Story(
        path=file_path,
        story_id=story_id,
        title=title,
        github_issue=github_issue,
        github_status=github_status,
        github_labels=github_labels,
        epic_id=epic_id,
        priority=priority,
        story_points=story_points,
        sprint=sprint,
        content=content,
    )


def extract_field(content: str, field: str) -> str:
    patterns = [
        rf"^{field}:\s*(.+)$",
        rf"^\*\*{field}\*\*:\s*(.+)$",
    ]
    for pattern in patterns:
        match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return ""


def format_issue_body(story: Story) -> str:
    as_a = extract_section(story.content, "As a", "I want") or "[user type]"
    i_want = extract_section(story.content, "I want", "So that") or "[goal]"
    so_that = extract_section(story.content, "So that", "##") or "[benefit]"

    body = f"""## Story Metadata

**Story ID**: {story.story_id}
**Epic ID**: {story.epic_id or "N/A"}
**Priority**: {story.priority}
**Story Points**: {story.story_points}
**Sprint**: {story.sprint or "Unassigned"}

## User Story

**As a** {as_a}
**I want** {i_want}
**So that** {so_that}

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

---
*Created via BMAD GitHub Bridge*
"""
    return body


def extract_section(content: str, start: str, end: str) -> str:
    if start not in content:
        return ""
    idx = content.index(start)
    remaining = content[idx + len(start) :]
    for e in ["\n##", "\n---", "\n\n"]:
        if e in remaining:
            return remaining[: remaining.index(e)].strip()
    return remaining.strip()


def main():
    parser = argparse.ArgumentParser(description="BMAD GitHub Bridge")
    parser.add_argument("--list", action="store_true", help="List all stories")
    parser.add_argument("--push", metavar="ID", help="Push story content to GitHub")
    parser.add_argument("--status", metavar="ID", help="Show status sync info for story")
    parser.add_argument("--sync-all", action="store_true", help="Show all stories with status")
    parser.add_argument("--path", default=".", help="Path to search for stories")

    args = parser.parse_args()

    if not any(vars(args).values()):
        parser.print_help()
        return

    stories = find_stories(args.path)

    if args.list:
        print(f"Found {len(stories)} stories:\n")
        for s in stories:
            pushed = f"→ #{s.github_issue}" if s.github_issue else "○ Not pushed"
            status = f"[{s.github_status}]" if s.github_status else ""
            print(f"  [{s.story_id}] {s.title} {pushed} {status}")

    elif args.push:
        story = next((s for s in stories if s.story_id == args.push), None)
        if not story:
            print(f"Story '{args.push}' not found")
            return

        if story.github_issue:
            print(f"Story '{args.push}' already pushed to #{story.github_issue}")
            return

        owner, repo = GITHUB_REPO.split("/")

        print(f"Pushing '{story.title}' to GitHub...\n")
        print("Run in opencode:")
        print(f"  skill(name='bmad-github-bridge')")
        print(
            f"  github_create_issue(owner='{owner}', repo='{repo}', title='{story.title}', body=story_body, labels=['story'])"
        )
        print("\nAfter creating, add to story file:")
        print(f'  github_issue: "#<issue_number>"')

    elif args.status:
        story = next((s for s in stories if s.story_id == args.status), None)
        if not story:
            print(f"Story '{args.status}' not found")
            return

        if not story.github_issue:
            print(f"Story '{args.status}' not linked to GitHub. Run --push first.")
            return

        issue_num = story.github_issue.lstrip("#")
        print(f"Story: [{story.story_id}] {story.title}")
        print(f"GitHub: #{issue_num}")
        print(f"Status: {story.github_status or 'unknown'}")
        print(f"Labels: {story.github_labels or 'none'}")
        print("\nTo sync status from GitHub, run in opencode:")
        print(f"  skill(name='bmad-github-bridge')")
        print(f"  github_get_issue(owner='aliuosio', repo='jobs', issue_number={issue_num})")
        print("\nThen update story with:")
        print(f'  github_status: "<open|closed>"')
        print(f'  github_labels: "<labels>"')

    elif args.sync_all:
        linked = [s for s in stories if s.github_issue]
        print(f"Stories with GitHub:\n")
        for s in linked:
            status = s.github_status or "-"
            labels = s.github_labels or ""
            print(f"  [{s.story_id}] {status} {labels} → #{s.github_issue}")

        unlinked = [s for s in stories if not s.github_issue]
        if unlinked:
            print(f"\nNot linked:")
            for s in unlinked:
                print(f"  [{s.story_id}] {s.title}")


if __name__ == "__main__":
    main()
