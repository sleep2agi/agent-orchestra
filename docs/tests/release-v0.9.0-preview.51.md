# `@sleep2agi/commhub-server@0.9.0-preview.51`

## 为什么发这一版:**agent 的回复终于进未读角标,而且按 agent 分**(#1828)

`.50` 之后 `server/src` 一个功能提交:

| 提交 | PR | 内容 |
|---|---|---|
| `d76b7f65` | #1838 | **#1828** —— `GET /api/messages?scope=user` 新增 `unread_by_agent`(user_inbox acked=0 + inbox 里 `session_name = 调用者用户名`、`type ∈ reply/task/message`、acked=0 的行,按 from_session 分)与 `unread_total`;`POST /api/messages/ack` 同一批 id 也 ack inbox 里发给调用者用户名的回复行,响应加 `acked_user_inbox` / `acked_inbox`;用户名与节点 alias 撞名时 inbox 半边整体跳过 |

`unread` / `pending_count` 口径**不变**(只算 user_inbox;`tests/qa-hub-14-user-unread` 钉着)。

| 用户看到的 | `.50` | `.51` + 桌面端 ≥ 0.2.58(app#278) |
|---|---|---|
| agent 回复了你的任务,你没看 | 角标靠客户端本地水位线估算(重装/换机就丢) | hub 权威数,按 agent 分,换机一致 |
| 你在聊天窗看到底 | 只推进本地水位线 | 同时向 hub ack(两表),别的设备也清零 |

## Install

```bash
npm i -g @sleep2agi/commhub-server@0.9.0-preview.51
```

## Upgrade

```bash
npm i -g @sleep2agi/commhub-server@0.9.0-preview.51
# 生产 hub 走 deploy/hub/README.md 的六步(改 launcher 的 RUNTIME_DIR 那一行,pm2 restart),不要整文件覆盖
```

## 证据

- `server/src/user-inbox-by-agent-http.test.ts` 7 用例(bootServer 真 HTTP):合并数、同网隔离、撞名跳过、B 拿 A 的 id ack 到 0 行、两表分开计数且幂等、status 行不 ack、撞名节点待办不 ack。变异:去掉撞名守卫 2 红;去掉 `session_name = ?1` 2 红。
- `user-inbox-read-http.test.ts` 13/13 不变;doc-symbol-pins 两种参数 rc=0;`docs-site/docs/api/rest.md` zh/en 已写新字段。

## promote 时的 must_contain

`"version": "0.9.0-preview.51"`(闸 4 对整个 `package/` 目录 `grep -rq`,命中 package.json)。
