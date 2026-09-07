# `@sleep2agi/agent-network@2.3.0-preview.87`

## 为什么发这一版:opencode 共存移植 macOS 的层①②(#1845)+ 配对 agent-node `.67`

`.86` 之后 `agent-network/src` 两个功能提交:

| 提交 | PR | 内容 |
|---|---|---|
| `efebe85f` | #1847 | **#1845 层①** —— opencode 包身份校验 `resolveOpencodePackageBinaryFromPath` 平台门 linux/darwin(win32 仍拦),规则逐字不动;Mac mini 真跑 VALIDATE_OK |
| `89325307` | #1848 | **#1845 层②** —— `resolveOpencodeTrustedRuntimeBase` darwin 默认 base `realpath($TMPDIR)`,祖先/权限规则不变;Mac mini 真跑:默认 OK,/tmp 与 755 目录仍拒 |

| 用户看到的 | `.86` | `.87` + agent-node `.67` |
|---|---|---|
| macOS 上起 opencode-cli 共存节点 | 「verification currently requires Linux」 | 走到真正的启动(host smoke 进行中,见 #1845) |
| Linux 上一切 | 不变 | 不变 |
| `anet node create` 配对装的 agent-node | `2.5.0-preview.66` | `2.5.0-preview.67` |

## Install

```bash
npm i -g @sleep2agi/agent-network@2.3.0-preview.87
```

## Upgrade

```bash
npm i -g @sleep2agi/agent-network@2.3.0-preview.87
```

## 证据

- `opencode-package-binary.test.ts` 16/16(+3 平台门);`opencode-safe-root-platform.test.ts` 7/7;`opencode-smoke-env.test.ts` 4/4;doc gates rc=0。
- Mac mini(uid 501)真跑两层模块源码:见 #1222 / #1845 评论。

## 边界

- macOS 完整链路(daemon → opencode 共存节点注册 → 收发任务)尚未验收;桌面端 daemon 装的是 `@latest`,promote 前 Vincent 的 Mac 用不到本版。
