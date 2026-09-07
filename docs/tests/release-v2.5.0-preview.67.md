# agent-node 2.5.0-preview.67

`.66` 之后 `agent-node/` 一个提交:

| 提交 | PR | 内容 |
|---|---|---|
| `cfaf68af` | #1849 | **#1845 层③** —— opencode 共存在 macOS 上的等价物:启动隔离 base darwin 默认 `realpath($TMPDIR)`(规则同 Linux);进程身份 `ps -o lstart=,state=`;启动树引用 `lsof -Fp +D`(macOS 同 uid 也读不到别进程环境,不能照搬 /proc/environ);win32 仍拦 |

## 这一版带给用户什么

配合 agent-network `2.3.0-preview.87`(层①②),macOS 上的 daemon 起 opencode-cli 共存节点不再在「requires Linux」处停下。Linux 行为逐字不变。**尚未在 macOS 上做完整 host smoke**(见 #1845),先发 preview 供 Mac mini 真跑。

## Install

```bash
npm i -g @sleep2agi/agent-node@2.5.0-preview.67
```

## Upgrade

```bash
npm i -g @sleep2agi/agent-node@2.5.0-preview.67
anet daemon restart <daemon>        # 或 anet node stop <name> && anet node start <name>
```

## 证据

- `runtime/opencode-acp/child-env-darwin.test.ts` 9 用例(Linux 上注入 darwin;ps / lsof 解析用 2026-09-07 Mac mini 真机样本);`child-env.test.ts` 18/18 不变。
- agent-node `tsc --noEmit` 错误数与 main 相同(既有 81,本版未新增)。

## promote 时的 must_contain

`"version": "2.5.0-preview.67"`(闸 4 对整个 `package/` 目录 `grep -rq`,命中 package.json)。
