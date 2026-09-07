// #1845 层③ —— agent-node 侧 opencode 共存在 macOS 上的三处等价物,在 Linux 上用注入/真机样本测:
//   ① 启动隔离 base:darwin 默认 realpath($TMPDIR),规则与 linux 同;win32 拦
//   ② 进程身份:`ps -o lstart=,state=` 解析(样本取自 2026-09-07 Mac mini)
//   ③ 启动树引用:`lsof -Fp +D` 解析(样本同上)
import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "fs";
import { join } from "path";
import {
  defaultOpencodeLaunchBase,
  parseDarwinPsStat,
  parseLsofPids,
  resolveTrustedLaunchBase,
} from "./child-env";

const cleanup: string[] = [];
afterEach(() => { for (const p of cleanup.splice(0)) rmSync(p, { recursive: true, force: true }); });

function privateBase(): string {
  if (process.platform !== "linux" || process.getuid === undefined) {
    throw new Error("these tests need Linux uid semantics (/run/user/<uid>)");
  }
  const userRoot = `/run/user/${process.getuid()}`;
  mkdirSync(userRoot, { recursive: true, mode: 0o700 });
  chmodSync(userRoot, 0o700);
  const base = mkdtempSync(join(userRoot, "anet-child-env-darwin-"));
  chmodSync(base, 0o700);
  cleanup.push(base);
  return base;
}

describe("#1845 ③ launch base platform policy", () => {
  test("win32 refused, naming the platform", () => {
    expect(() => resolveTrustedLaunchBase(undefined, "win32", {})).toThrow(/requires Linux or macOS uid semantics \(got win32\)/);
  });
  test("darwin default base is $TMPDIR (absolute, trailing slash trimmed); missing → refused", () => {
    expect(defaultOpencodeLaunchBase(501, "darwin", { TMPDIR: "/private/var/folders/xx/yy/T/" })).toBe("/private/var/folders/xx/yy/T");
    expect(() => defaultOpencodeLaunchBase(501, "darwin", {})).toThrow(/needs an absolute per-user TMPDIR/);
  });
  test("darwin accepts a uid-owned 0700 TMPDIR, also when reached through a symlink", () => {
    const base = privateBase();
    expect(resolveTrustedLaunchBase(undefined, "darwin", { TMPDIR: base }).path).toBe(base);
    const link = join(base, "..", `l-${Date.now()}`);
    symlinkSync(base, link); cleanup.push(link);
    expect(resolveTrustedLaunchBase(undefined, "darwin", { TMPDIR: link }).path).toBe(base);
  });
  test("darwin refuses a 0770 TMPDIR by the shared rule; explicit base stays canonical-only", () => {
    const base = privateBase();
    chmodSync(base, 0o770);
    expect(() => resolveTrustedLaunchBase(undefined, "darwin", { TMPDIR: base })).toThrow(/group\/other writable|must be owned by uid/);
    chmodSync(base, 0o700);
    const link = join(base, "..", `e-${Date.now()}`);
    symlinkSync(base, link); cleanup.push(link);
    expect(() => resolveTrustedLaunchBase(undefined, "darwin", { ANET_OPENCODE_SAFE_BASE: link })).toThrow(/symlinks are not allowed/);
  });
  test("linux default base unchanged", () => {
    expect(defaultOpencodeLaunchBase(process.getuid!(), "linux", {})).toBe(`/run/user/${process.getuid!()}`);
  });
});

describe("#1845 ③ darwin process identity via ps", () => {
  test("parses lstart + state from the real ps shape", () => {
    const stat = parseDarwinPsStat("Mon Sep  7 17:38:47 2026    Ss\n", 323);
    expect(stat?.state).toBe("S");
    expect(stat?.identity).toBe(`323:${Math.floor(Date.parse("Mon Sep  7 17:38:47 2026") / 1000)}`);
  });
  test("zombie state keeps Z; empty output (pid gone) → undefined", () => {
    expect(parseDarwinPsStat("Mon Sep  7 17:38:47 2026 Z\n", 500)?.state).toBe("Z");
    expect(parseDarwinPsStat("\n", 1)).toBeUndefined();
    expect(parseDarwinPsStat("garbage", 1)).toBeUndefined();
  });
  test("identity changes when the same pid has a different start time (pid reuse)", () => {
    const a = parseDarwinPsStat("Mon Sep  7 17:38:47 2026 S", 9)!.identity;
    const b = parseDarwinPsStat("Mon Sep  7 17:38:48 2026 S", 9)!.identity;
    expect(a).not.toBe(b);
  });
});

describe("#1845 ③ darwin launch-root references via lsof", () => {
  test("parses -F pid records, ignores other fields and duplicates", () => {
    expect(parseLsofPids("p507\nfcwd\np507\nfcwd\np800\ntxt\n")).toEqual([507, 800]);
    expect(parseLsofPids("")).toEqual([]);
    expect(parseLsofPids("pabc\n")).toEqual([]);
  });
});
