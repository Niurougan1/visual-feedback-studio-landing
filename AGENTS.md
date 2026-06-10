# Repository Instructions

## Read First: Repository Priority Map

This project is split across three GitHub repositories. Treat this section as the authoritative map; do not ask the user to paste these URLs again.

| Priority | Repo | Role | Use it when the user says |
| --- | --- | --- | --- |
| 1 | `Niurougan1/visual-feedback-studio-private` | Private main development repository. This is the source of truth for core implementation, internal plans, strategy, reviews, submissions, experiments, and sensitive product direction. | "新仓库", "私有仓", "主仓", "核心仓", "开发仓", "真实仓", "private repo" |
| 2 | `Niurougan1/visual-feedback-studio` | Public repository. This is the public-safe runnable project/code/docs surface. It can contain normal usable project code and public docs, but must not contain internal methodology, private planning, sensitive roadmap, reviews, submissions, or landing source snapshots. | "旧仓库", "公开仓", "老仓库", "public repo", "GitHub 公开页" |
| 3 | `Niurougan1/visual-feedback-studio-landing` | Dedicated landing-page repository. This repository is the canonical source for the public marketing/landing page and its copyable setup command. | "落地页", "官网", "landing", "首页", "营销页" |

Operational rules:

- Landing page UI, copy, CTA buttons, analytics, and assets belong in this repository.
- Core product implementation belongs in the private repo.
- Public install docs and public-safe runnable code belong in the public repo.
- Do not place internal methodology, private planning, sensitive roadmap, reviews, submissions, or private strategy content in this landing repo.
- The landing page setup CTA must use this exact one-line public install command unless the user explicitly changes it:

```bash
curl -fsSL https://raw.githubusercontent.com/Niurougan1/visual-feedback-studio/main/scripts/install.sh | bash
```

If port `3456` is occupied, docs may mention:

```bash
curl -fsSL https://raw.githubusercontent.com/Niurougan1/visual-feedback-studio/main/scripts/install.sh | VFS_PORT=3463 bash
```
