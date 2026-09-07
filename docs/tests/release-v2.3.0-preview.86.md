# `@sleep2agi/agent-network@2.3.0-preview.86`

## 为什么发这一版:#1832 sibling-first 在 npm -g / --prefix 布局下终于命中(#1834)

`.85` 的 `findSiblingAgentNode` 用 `resolve(process.argv[1])` = `<prefix>/bin/anet`(npm 建的符号链接),
从 `<prefix>/bin` 往上找不到 `node_modules`,同一 prefix 里装好的 agent-node **永远命不中**,退到 PATH 上另一棵树的
老版本。Vincent 2026-09-07 的 Mac 就是这样(nvm v20 的旧 agent-node)让本机 daemon 以普通节点身份注册、进不了
host_supervisor 列表(app#271)。本版入口先 `realpath`(失败退回原路径、不抛),旁边的 agent-node 才是第一优先。

| 用户看到的 | `.85` | `.86` |
|---|---|---|
| `npm i -g --prefix $P @sleep2agi/agent-network @sleep2agi/agent-node` 后 `anet daemon start` / `node start` | 日志「agent-node will be lazy-fetched via npx」或用 PATH 上的旧版 | 日志「using the agent-node installed beside anet (…)」 |
| 全局散装(旁边没有 agent-node) | PATH → npx | 不变:PATH → npx |
| 配对 agent-node(`anet node create` 装的) | `2.5.0-preview.66` | `2.5.0-preview.66`(不变) |

## Install

```bash
npm i -g @sleep2agi/agent-network@2.3.0-preview.86
```

## Upgrade

```bash
npm i -g @sleep2agi/agent-network@2.3.0-preview.86
```

## 验证(发布后在 DEV 真跑)

```bash
P=$(mktemp -d); npm i -g --prefix "$P" @sleep2agi/agent-network@2.3.0-preview.86 @sleep2agi/agent-node@2.5.0-preview.66
PATH=$(dirname "$(command -v node)"):/usr/bin:/bin "$P/bin/anet" node start <某个 claude-agent-sdk 节点> 2>&1 | grep -F 'beside anet'
```

## 边界

- 只改 agent-node 的定位顺序;已在跑的节点不需要重启。`ANET_AGENT_NODE_BIN` 显式指定仍然最高优先。
- 桌面端本机 daemon 安装器(desktop-v0.2.55)装的是 `@latest`,要等 promote 到 latest 才吃到;0.2.55 自己已用「私有 bin 放 PATH 最前」绕过。
