# `@sleep2agi/commhub-server@0.9.0-preview.52`

## 为什么发这一版:**桌面向导能看到 daemon 回的「为什么建不起来」**(#1843)

`.51` 之后 `server/src` 一个功能提交:

| 提交 | PR | 内容 |
|---|---|---|
| `bf643241` | #1843 | 新增 `GET /api/node-create-requests?request_id=`:读一条 create_node 请求的 status / error(daemon 通过 `ack_create_request` 写回);网络作用域同其它 REST;不存在与不在作用域同形 404;无用户上下文 401;缺参 400 |

| 用户看到的 | `.51` | `.52` + 桌面端 ≥ 0.2.60(app#286) |
|---|---|---|
| 向导建节点、daemon 起不来 | 「已下发,但 24s 内未看到子节点注册」 | 立刻显示 daemon 回的原因(如 opencode-cli 校验 Linux-only) |

## Install

```bash
npm i -g @sleep2agi/commhub-server@0.9.0-preview.52
```

## Upgrade

```bash
npm i -g @sleep2agi/commhub-server@0.9.0-preview.52
# 生产 hub 走 deploy/hub/README.md 的六步(改 launcher 的 RUNTIME_DIR 那一行,pm2 restart),不要整文件覆盖
```

## 证据

- `server/src/node-create-request-status-http.test.ts` 5 用例(bootServer 真 HTTP):本网读到 error 原文、别网 404 与不存在同形、pending 无 error、400、401。
- `docs-site/docs/api/rest.md` zh/en 已写该接口;doc-symbol-pins / docs-integrity / channel-assertions 本地 rc=0。

## promote 时的 must_contain

`"version": "0.9.0-preview.52"`(闸 4 对整个 `package/` 目录 `grep -rq`,命中 package.json)。
