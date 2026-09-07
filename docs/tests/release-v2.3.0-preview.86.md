# `@sleep2agi/agent-network@2.3.0-preview.86`

## 为什么发这一版:#1832 realpath 兜底(#1834)—— 🔴 附更正

**更正(2026-09-07 10:25,DEV 真跑 .85/.86 同布局对照):** #1832 的前提不成立。`npm i -g --prefix $P` 布局下
`dist/bin/anet.cjs` 垫片在 import cli.js 之前就把 `process.argv[1]` 改写成真实的 `dist/bin/cli.js`,所以 `.85` 的
sibling-first **本来就命中**——两个版本起节点都打「using the agent-node installed beside anet (2.5.0-preview.66)」。
当时误判的依据是 `anet daemon start` 打的「[anet] note: agent-node will be lazy-fetched via npx on first start」,
那句来自 `cli.ts` 只看 PATH 的 `commandExists("agent-node")` 分支,和真正的启动决策无关(下一版起,旁边有 agent-node 时
不再打这句)。

本版的 realpath 改动是无害兜底:argv[1] 已是真路径时是 no-op;只对「把 cli.js 直接符号链接到别处」这类非 npm 布局有意义。
Vincent Mac 上 daemon 用旧 agent-node 的根因不变:desktop-v0.2.54 的私有 prefix **没装** agent-node(sibling 为空)→ PATH 上
nvm v20 的旧版;desktop-v0.2.55 起私有 prefix 同时装 agent-node。

| 用户看到的 | `.85` | `.86` |
|---|---|---|
| `npm i -g --prefix $P …` 后 `anet node start`(PATH 无 agent-node) | 「using the agent-node installed beside anet」(**已命中**) | 相同 |
| `anet daemon start` 的「lazy-fetched via npx」note | 旁边有 agent-node 也打(误导) | 相同(修复在下一版) |
| 配对 agent-node(`anet node create` 装的) | `2.5.0-preview.66` | `2.5.0-preview.66`(不变) |

## Install

```bash
npm i -g @sleep2agi/agent-network@2.3.0-preview.86
```

## Upgrade

```bash
npm i -g @sleep2agi/agent-network@2.3.0-preview.86
```

## 验证(2026-09-07 10:23 DEV 已真跑)

```bash
# .85 与 .86 各装一个 --prefix,HOME 指临时目录、hub 指 127.0.0.1:1(不碰生产)、PATH 只留 node
P=$(mktemp -d); npm i -g --prefix "$P" @sleep2agi/agent-network@2.3.0-preview.86 @sleep2agi/agent-node@2.5.0-preview.66
PATH=$(dirname "$(command -v node)"):/usr/bin:/bin "$P/bin/anet" node start <claude-agent-sdk 节点> 2>&1 | grep -F 'beside anet'
# 结果:.85 与 .86 都输出「using the agent-node installed beside anet (2.5.0-preview.66)」
```

## 边界

- 只改 agent-node 的定位顺序;已在跑的节点不需要重启。`ANET_AGENT_NODE_BIN` 显式指定仍然最高优先。
- 桌面端本机 daemon 安装器(desktop-v0.2.55)装的是 `@latest`,要等 promote 到 latest 才吃到;0.2.55 自己已用「私有 bin 放 PATH 最前」绕过。
