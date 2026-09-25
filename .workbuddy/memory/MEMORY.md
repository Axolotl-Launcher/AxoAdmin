# AxoAdmin 项目长期记忆（本地补充）

## 本机环境注意

- **执行 git 破坏性操作（stash/reset/clean）前先确认 `.git` 存在**：2026-09-12 曾在 `git stash push -u` 期间整个 `.git` 目录消失（疑似本机 Bash shim/沙箱环境异常），靠原地 `git init -b main` + fetch + `git reset --hard origin/main` + `git clean -fd` 恢复，详见 `2026-09-12.md`。
