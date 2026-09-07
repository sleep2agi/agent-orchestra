// #1845 层② —— safe-root 的平台门与默认 base:linux 与 darwin 共用同一套祖先/权限规则,只是默认 base 不同。
// 在 Linux CI 上用注入的 platform/env 测 darwin 分支;真机验证见 #1845(Mac mini)。
import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "fs";
import { join } from "path";
import { defaultOpencodeRuntimeBase, resolveOpencodeTrustedRuntimeBase } from "./opencode-safe-root";

const cleanup: string[] = [];
afterEach(() => { for (const p of cleanup.splice(0)) rmSync(p, { recursive: true, force: true }); });

function privateBase(): string {
  if (process.platform !== "linux" || process.getuid === undefined) {
    throw new Error("safe-root platform tests need Linux uid semantics (/run/user/<uid>)");
  }
  const userRoot = `/run/user/${process.getuid()}`;
  mkdirSync(userRoot, { recursive: true, mode: 0o700 });
  chmodSync(userRoot, 0o700);
  const base = mkdtempSync(join(userRoot, "anet-safe-root-darwin-"));
  chmodSync(base, 0o700);
  cleanup.push(base);
  return base;
}

describe("#1845 safe-root platform gate", () => {
  test("win32 is refused with the platform named", () => {
    expect(() => resolveOpencodeTrustedRuntimeBase(undefined, "win32", {}))
      .toThrow(/requires Linux or macOS uid semantics \(got win32\)/);
  });
  test("darwin default base is $TMPDIR; missing or relative TMPDIR is refused", () => {
    expect(() => defaultOpencodeRuntimeBase(501, "darwin", {})).toThrow(/needs an absolute per-user TMPDIR/);
    expect(() => defaultOpencodeRuntimeBase(501, "darwin", { TMPDIR: "relative/tmp" })).toThrow(/needs an absolute per-user TMPDIR/);
    expect(defaultOpencodeRuntimeBase(501, "darwin", { TMPDIR: "/private/var/folders/xx/yy/T/" })).toBe("/private/var/folders/xx/yy/T");
  });
  test("darwin: a uid-owned 0700 TMPDIR under trusted ancestors is accepted", () => {
    const base = privateBase();
    const id = resolveOpencodeTrustedRuntimeBase(undefined, "darwin", { TMPDIR: base });
    expect(id.path).toBe(base);
  });
  test("darwin: TMPDIR reached through a symlink resolves to its real 0700 directory", () => {
    const base = privateBase();
    const link = join(base, "..", `link-${Date.now()}`);
    symlinkSync(base, link);
    cleanup.push(link);
    expect(resolveOpencodeTrustedRuntimeBase(undefined, "darwin", { TMPDIR: link }).path).toBe(base);
  });
  test("darwin: a group-writable TMPDIR is refused by the same rule as linux", () => {
    const base = privateBase();
    chmodSync(base, 0o770);
    expect(() => resolveOpencodeTrustedRuntimeBase(undefined, "darwin", { TMPDIR: base }))
      .toThrow(/refuses untrusted runtime-base ancestor|must be uid-owned with mode 0700/);
  });
  test("explicit ANET_OPENCODE_SAFE_BASE keeps the canonical-only rule on darwin too", () => {
    const base = privateBase();
    const link = join(base, "..", `elink-${Date.now()}`);
    symlinkSync(base, link);
    cleanup.push(link);
    expect(() => resolveOpencodeTrustedRuntimeBase(undefined, "darwin", { ANET_OPENCODE_SAFE_BASE: link, TMPDIR: base }))
      .toThrow(/refuses a symlinked safe runtime base/);
    expect(resolveOpencodeTrustedRuntimeBase(undefined, "darwin", { ANET_OPENCODE_SAFE_BASE: base }).path).toBe(base);
  });
  test("linux default base is /run/user/<uid> (unchanged)", () => {
    expect(defaultOpencodeRuntimeBase(process.getuid!(), "linux", {})).toBe(`/run/user/${process.getuid!()}`);
  });
});
