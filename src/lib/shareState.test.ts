import { describe, expect, it } from "vitest";
import {
  decodeShareState,
  encodeShareState,
  parseAdvanced,
  parseAlgo,
  parseMode,
  parseView,
} from "./shareState";

const toB64url = (s: string) => Buffer.from(s, "utf8").toString("base64url");

describe("encodeShareState/decodeShareState", () => {
  it("往返编码（含中文输入）", () => {
    const state = { a: "daliuren", i: { question: "今日运势如何？", day: 3, note: "甲子日" } };
    const d = encodeShareState(state);
    expect(d).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeShareState(d)).toEqual(state);
  });

  it("空输入对象可往返", () => {
    expect(decodeShareState(encodeShareState({ a: "liuyao", i: {} }))).toEqual({
      a: "liuyao",
      i: {},
    });
  });

  it("非法/损坏的 d 静默返回 null", () => {
    expect(decodeShareState("")).toBeNull();
    expect(decodeShareState("!!!")).toBeNull();
    expect(decodeShareState("a")).toBeNull(); // 长度 % 4 == 1，atob 拒绝
    expect(decodeShareState(toB64url("not json"))).toBeNull();
    expect(decodeShareState(toB64url('{"a":123,"i":{}}'))).toBeNull();
    expect(decodeShareState(toB64url('{"a":"","i":{}}'))).toBeNull();
    expect(decodeShareState(toB64url('{"a":"daliuren","i":"oops"}'))).toBeNull();
    expect(decodeShareState(toB64url('{"a":"daliuren","i":[1,2]}'))).toBeNull();
    expect(decodeShareState(toB64url('{"a":"daliuren","i":{"x":true}}'))).toBeNull();
    expect(decodeShareState(toB64url("[1,2,3]"))).toBeNull();
  });
});

describe("URL 参数解析", () => {
  it("parseView 非法值回退 divine", () => {
    expect(parseView(null)).toBe("divine");
    expect(parseView("divine")).toBe("divine");
    expect(parseView("help")).toBe("help");
    expect(parseView("history")).toBe("history");
    expect(parseView("xxx")).toBe("divine");
  });

  it("parseMode 仅认 derive", () => {
    expect(parseMode(null)).toBe("result");
    expect(parseMode("derive")).toBe("derive");
    expect(parseMode("result")).toBe("result");
    expect(parseMode("xxx")).toBe("result");
  });

  it("parseAdvanced 仅认 1", () => {
    expect(parseAdvanced(null)).toBe(false);
    expect(parseAdvanced("0")).toBe(false);
    expect(parseAdvanced("1")).toBe(true);
    expect(parseAdvanced("true")).toBe(false);
  });

  it("parseAlgo 校验白名单", () => {
    const ids = ["daliuren", "liuyao"];
    expect(parseAlgo(null, ids, "daliuren")).toBe("daliuren");
    expect(parseAlgo("liuyao", ids, "daliuren")).toBe("liuyao");
    expect(parseAlgo("evil", ids, "daliuren")).toBe("daliuren");
  });
});
