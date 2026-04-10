#!/usr/bin/env python3
"""
BMAD Story Exporter

Export BMAD stories to various ticket system formats:
- GitHub Issues (JSON/CSV)
- Jira (JSON)
- Linear (JSON)
- CSV (generic)

Usage:
    python scripts/export_stories.py --format github --epic EPIC-001
    python scripts/export_stories.py --format jira --output tickets.json
    python scripts/export_stories.py --format csv --output tickets.csv
"""

import argparse
import csv
import json
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional


@dataclass
class BmadStory:
    """Represents a BMAD story."""

    story_id: str
    title: str
    epic_id: Optional[str] = None
    priority: str = "medium"
    story_points: int = 2
    sprint: Optional[str] = None
    as_a: str = ""
    i_want: str = ""
    so_that: str = ""
    acceptance_criteria: list[str] = None
    technical_notes: str = ""
    dependencies: list[str] = None
    verification_steps: list[str] = None

    def __post_init__(self):
        if self.acceptance_criteria is None:
            self.acceptance_criteria = []
        if self.dependencies is None:
            self.dependencies = []
        if self.verification_steps is None:
            self.verification_steps = []


def parse_story_file(file_path: Path) -> Optional[BmadStory]:
    """Parse a BMAD story file."""
    content = file_path.read_text()

    # Extract fields from markdown frontmatter or content
    story = BmadStory(
        story_id=extract_field(content, "story_id", file_path.stem),
        title=extract_field(content, "title", file_path.stem) or file_path.stem,
        epic_id=extract_field(content, "epic_id"),
        priority=extract_field(content, "priority", "medium"),
        story_points=int(extract_field(content, "story_points", "2") or "2"),
        sprint=extract_field(content, "sprint"),
        as_a=extract_field(content, "as_a")
        or extract_section(content, "User Story", "As a", "I want"),
        i_want=extract_section(content, "I want", "I want", "So that"),
        so_that=extract_section(content, "So that", "So that", "\n")
        or extract_section(content, "So that", "So that", "##"),
        technical_notes=extract_section(content, "Technical Notes", "Technical Notes", "##"),
        dependencies=extract_list(content, "Dependencies"),
        verification_steps=extract_list(content, "Verification Steps"),
    )

    # Parse acceptance criteria from checkbox list
    story.acceptance_criteria = extract_checkboxes(content, "Acceptance Criteria")

    return story


def extract_field(content: str, field: str, default: str = None) -> Optional[str]:
    """Extract a field value from content."""
    import re

    patterns = [
        rf"^{field}:\s*(.+)$",  # Key: Value
        rf"^\*\*{field}\*\*:\s*(.+)$",  # **Key**: Value
    ]
    for pattern in patterns:
        match = re.search(pattern, content, re.MULTILINE | re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return default


def extract_section(content: str, section_name: str, start_marker: str, end_marker: str) -> str:
    """Extract a section from content."""
    import re

    pattern = rf"{section_name}\s*\n(.*?)(?={end_marker}|$)"
    match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # Try alternative extraction
    if start_marker in content:
        idx = content.index(start_marker)
        remaining = content[idx + len(start_marker) :]
        for end in ["##", "\n\n##", "\n---"]:
            if end in remaining:
                return remaining[: remaining.index(end)].strip()
    return ""


def extract_list(content: str, section_name: str) -> list[str]:
    """Extract list items from a section."""
    import re

    pattern = rf"{section_name}\s*\n((?:- .+\n?)+)"
    match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
    if match:
        items = re.findall(r"- (.+)", match.group(1))
        return [item.strip() for item in items if item.strip()]
    return []


def extract_checkboxes(content: str, section_name: str) -> list[str]:
    """Extract checkbox items from a section."""
    import re

    pattern = rf"{section_name}\s*\n((?:- \[ .+\]\s*.+\n?)+)"
    match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
    if match:
        items = re.findall(r"- \[ .+\]\s*(.+)", match.group(1))
        return [item.strip() for item in items if item.strip()]
    return []


def export_github(stories: list[BmadStory], output: str = None) -> str:
    """Export stories as GitHub Issues JSON."""
    issues = []
    for story in stories:
        issue = {
            "title": f"[Story] {story.title}",
            "body": format_github_body(story),
            "labels": ["story", "bmad"],
        }
        if story.epic_id:
            issue["labels"].append(story.epic_id)
        issues.append(issue)

    result = json.dumps(issues, indent=2)
    if output:
        Path(output).write_text(result)
        print(f"Exported {len(issues)} GitHub issues to {output}")
    return result


def format_github_body(story: BmadStory) -> str:
    """Format story as GitHub issue body."""
    body = f"""## Story Metadata

**Story ID**: {story.story_id}
**Epic ID**: {story.epic_id or "N/A"}
**Priority**: {story.priority}
**Story Points**: {story.story_points}
**Sprint**: {story.sprint or "Unassigned"}

## User Story

**As a** {story.as_a}
**I want** {story.i_want}
**So that** {story.so_that}

## Acceptance Criteria

"""
    for criterion in story.acceptance_criteria:
        body += f"- [ ] {criterion}\n"

    if story.technical_notes:
        body += f"\n## Technical Notes\n\n{story.technical_notes}\n"

    if story.dependencies:
        body += "\n## Dependencies\n\n"
        for dep in story.dependencies:
            body += f"- {dep}\n"

    if story.verification_steps:
        body += "\n## Verification Steps\n\n"
        for i, step in enumerate(story.verification_steps, 1):
            body += f"{i}. {step}\n"

    body += "\n---\n*Generated by BMAD*"
    return body


def export_jira(stories: list[BmadStory], output: str = None) -> str:
    """Export stories as Jira Issues JSON."""
    issues = []
    for story in stories:
        issue = {
            "fields": {
                "project": {"key": "PROJECT"},
                "summary": story.title,
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": f"**As a:** {story.as_a}"}],
                        },
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": f"**I want:** {story.i_want}"}],
                        },
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": f"**So that:** {story.so_that}"}],
                        },
                    ],
                },
                "issuetype": {"name": "Story"},
                "priority": {"name": story.priority.title()},
                "customfield_10016": story.story_points,  # Story points (varies by Jira config)
            }
        }

        # Add acceptance criteria as labels
        if story.acceptance_criteria:
            issue["fields"]["labels"] = [f"ac:{c[:30]}" for c in story.acceptance_criteria[:5]]

        issues.append(issue)

    result = json.dumps(issues, indent=2)
    if output:
        Path(output).write_text(result)
        print(f"Exported {len(issues)} Jira issues to {output}")
    return result


def export_linear(stories: list[BmadStory], output: str = None) -> str:
    """Export stories as Linear Issues JSON."""
    issues = []
    for story in stories:
        issue = {
            "title": story.title,
            "description": format_linear_body(story),
            "priority": priority_to_linear(story.priority),
            "estimate": story.story_points,
            "labels": [
                {"name": "story"},
                {"name": story.epic_id.lower().replace("-", "_")} if story.epic_id else None,
            ].filter(None),
        }
        issues.append(issue)

    result = json.dumps(issues, indent=2)
    if output:
        Path(output).write_text(result)
        print(f"Exported {len(issues)} Linear issues to {output}")
    return result


def priority_to_linear(priority: str) -> int:
    """Convert priority string to Linear priority number."""
    mapping = {
        "urgent": 1,
        "high": 2,
        "medium": 3,
        "low": 4,
    }
    return mapping.get(priority.lower(), 3)


def format_linear_body(story: BmadStory) -> str:
    """Format story as Linear issue description."""
    body = f"""## User Story

**As a** {story.as_a}
**I want** {story.i_want}
**So that** {story.so_that}

## Acceptance Criteria

"""
    for criterion in story.acceptance_criteria:
        body += f"- [ ] {criterion}\n"

    if story.technical_notes:
        body += f"\n## Technical Notes\n\n{story.technical_notes}\n"

    return body


def export_csv(stories: list[BmadStory], output: str = None) -> str:
    """Export stories as CSV."""
    rows = []
    for story in stories:
        rows.append(
            {
                "story_id": story.story_id,
                "title": story.title,
                "epic_id": story.epic_id or "",
                "priority": story.priority,
                "story_points": story.story_points,
                "sprint": story.sprint or "",
                "as_a": story.as_a,
                "i_want": story.i_want,
                "so_that": story.so_that,
                "acceptance_criteria": " | ".join(story.acceptance_criteria),
                "technical_notes": story.technical_notes,
                "dependencies": " | ".join(story.dependencies),
                "verification_steps": " | ".join(story.verification_steps),
            }
        )

    if not rows:
        return ""

    import io

    output_io = io.StringIO()
    writer = csv.DictWriter(output_io, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

    result = output_io.getvalue()
    if output:
        Path(output).write_text(result)
        print(f"Exported {len(rows)} stories to {output}")
    return result


def find_story_files(directory: Path = Path(".")) -> list[Path]:
    """Find all BMAD story files."""
    patterns = [
        "**/*.story.md",
        "**/stories/**/*.md",
        "**/specs/**/story.md",
    ]
    files = []
    for pattern in patterns:
        files.extend(directory.glob(pattern))
    return sorted(files)


def main():
    parser = argparse.ArgumentParser(description="Export BMAD stories to ticket formats")
    parser.add_argument(
        "--format",
        "-f",
        choices=["github", "jira", "linear", "csv"],
        default="github",
        help="Export format",
    )
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--epic", "-e", help="Filter by epic ID")
    parser.add_argument("--sprint", "-s", help="Filter by sprint")
    parser.add_argument("--path", "-p", default=".", help="Path to search for stories")

    args = parser.parse_args()

    story_files = find_story_files(Path(args.path))

    if not story_files:
        print("No story files found. Looking for:")
        print("  - **/*.story.md")
        print("  - **/stories/**/*.md")
        print("  - **/specs/**/story.md")
        sys.exit(1)

    print(f"Found {len(story_files)} story files")

    stories = []
    for file_path in story_files:
        story = parse_story_file(file_path)
        if story:
            # Apply filters
            if args.epic and story.epic_id != args.epic:
                continue
            if args.sprint and story.sprint != args.sprint:
                continue
            stories.append(story)

    if not stories:
        print("No stories matched the filter criteria")
        sys.exit(1)

    print(f"Exporting {len(stories)} stories...")

    # Export based on format
    if args.format == "github":
        export_github(stories, args.output)
    elif args.format == "jira":
        export_jira(stories, args.output)
    elif args.format == "linear":
        export_linear(stories, args.output)
    elif args.format == "csv":
        export_csv(stories, args.output)


if __name__ == "__main__":
    main()
