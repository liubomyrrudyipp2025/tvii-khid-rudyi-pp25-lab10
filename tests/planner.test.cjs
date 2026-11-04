"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const file = path.join(__dirname, "../js/widget.js");

test("default evening: complete rounds, only intermediate breaks, one balanced group", () => {
  const api = fs.existsSync(file) ? require(file) : {};
  assert.equal(typeof api.calculatePlan, "function", "The planner must expose testable real business logic to Node, without browser globals");
  const actual = api.calculatePlan({ players: "4", minutes: "120", duration: "30", breaks: true });
  assert.deepEqual(actual, { ok: true, errors: {}, rounds: 3, groups: [4], games: 3, used: 100, free: 20 });
});

const validCases = [
  {
    "scenario": "Default Happy Path",
    "raw": {
      "players": "4",
      "minutes": "120",
      "duration": "30",
      "breaks": true
    },
    "expected": {
      "ok": true,
      "errors": {},
      "rounds": 3,
      "groups": [
        4
      ],
      "games": 3,
      "used": 100,
      "free": 20
    }
  },
  {
    "scenario": "Balanced groups: no singleton",
    "raw": {
      "players": "5",
      "minutes": "120",
      "duration": "30",
      "breaks": true
    },
    "expected": {
      "ok": true,
      "errors": {},
      "rounds": 3,
      "groups": [
        3,
        2
      ],
      "games": 6,
      "used": 100,
      "free": 20
    }
  },
  {
    "scenario": "Checkbox changes timing",
    "raw": {
      "players": "8",
      "minutes": "120",
      "duration": "30",
      "breaks": false
    },
    "expected": {
      "ok": true,
      "errors": {},
      "rounds": 4,
      "groups": [
        4,
        4
      ],
      "games": 8,
      "used": 120,
      "free": 0
    }
  },
  {
    "scenario": "Valid zero rounds",
    "raw": {
      "players": "2",
      "minutes": "15",
      "duration": "30",
      "breaks": true
    },
    "expected": {
      "ok": true,
      "errors": {},
      "rounds": 0,
      "groups": [
        2
      ],
      "games": 0,
      "used": 0,
      "free": 15
    }
  },
  {
    "scenario": "Inclusive minimum and no final break",
    "raw": {
      "players": "2",
      "minutes": "15",
      "duration": "15",
      "breaks": true
    },
    "expected": {
      "ok": true,
      "errors": {},
      "rounds": 1,
      "groups": [
        2
      ],
      "games": 1,
      "used": 15,
      "free": 0
    }
  },
  {
    "scenario": "Inclusive maximum",
    "raw": {
      "players": "12",
      "minutes": "240",
      "duration": "15",
      "breaks": true
    },
    "expected": {
      "ok": true,
      "errors": {},
      "rounds": 12,
      "groups": [
        4,
        4,
        4
      ],
      "games": 36,
      "used": 235,
      "free": 5
    }
  },
  {
    "scenario": "Select change",
    "raw": {
      "players": "4",
      "minutes": "120",
      "duration": "60",
      "breaks": true
    },
    "expected": {
      "ok": true,
      "errors": {},
      "rounds": 1,
      "groups": [
        4
      ],
      "games": 1,
      "used": 60,
      "free": 60
    }
  }
];
const invalidCases = [{"field": "players", "value": ""}, {"field": "players", "value": "   "}, {"field": "players", "value": "0"}, {"field": "players", "value": "-5"}, {"field": "players", "value": "9999999999999999"}, {"field": "players", "value": "2.5"}, {"field": "players", "value": "abc"}, {"field": "players", "value": "2abc"}, {"field": "players", "value": "2e0"}, {"field": "players", "value": "0x4"}, {"field": "players", "value": "NaN"}, {"field": "players", "value": "Infinity"}, {"field": "minutes", "value": ""}, {"field": "minutes", "value": "14"}, {"field": "minutes", "value": "241"}, {"field": "minutes", "value": "120.5"}, {"field": "duration", "value": "42"}, {"field": "duration", "value": "30 "}, {"field": "breaks", "value": "false"}];
const { calculatePlan } = require("../js/widget.js");
test("seven specified reference calculations", () => {
  for (const item of validCases) assert.deepEqual(calculatePlan(item.raw), item.expected, item.scenario);
});
test("invalid fields produce only errors, never stale numeric results", () => {
  for (const item of invalidCases) {
    const raw = { players: "4", minutes: "120", duration: "30", breaks: true, [item.field]: item.value };
    const actual = calculatePlan(raw);
    assert.equal(actual.ok, false, JSON.stringify(item));
    assert.equal(typeof actual.errors[item.field], "string");
    assert.ok(actual.errors[item.field].length > 0);
    assert.deepEqual(Object.keys(actual).sort(), ["errors", "ok"]);
  }
});
test("malformed record and unexpected field types never throw", () => {
  for (const raw of [null, undefined, [], 0, "4", Number.NaN, Symbol("qa")]) {
    assert.doesNotThrow(() => { assert.equal(calculatePlan(raw).ok, false); });
  }
  for (const field of ["players", "minutes", "duration", "breaks"]) {
    for (const bad of [null, undefined, [], {}, Number.NaN, Number.POSITIVE_INFINITY]) {
      const raw = { players: "4", minutes: "120", duration: "30", breaks: true, [field]: bad };
      assert.equal(calculatePlan(raw).ok, false);
    }
  }
});
test("all bounded combinations match an independent iterative schedule oracle", () => {
  let count = 0;
  for (let p = 2; p <= 12; p++) for (let t = 15; t <= 240; t++) {
    for (const d of [15, 30, 45, 60]) for (const breaks of [false, true]) {
      const actual = calculatePlan({ players: String(p), minutes: String(t), duration: String(d), breaks });
      const b = breaks ? 5 : 0;
      let rounds = 0, used = 0;
      while (used + (rounds ? b : 0) + d <= t) { used += (rounds ? b : 0) + d; rounds++; }
      assert.equal(actual.ok, true); assert.equal(actual.rounds, rounds); assert.equal(actual.used, used);
      assert.equal(actual.free, t - used); assert.equal(actual.games, rounds * actual.groups.length);
      assert.equal(actual.groups.reduce((a, n) => a + n, 0), p);
      assert.ok(actual.groups.every(n => n >= 2 && n <= 4));
      assert.ok(Math.max(...actual.groups) - Math.min(...actual.groups) <= 1);
      assert.ok(actual.groups.length === 1 || (actual.groups.length - 1) * 4 < p);
      count++;
    }
  }
  console.log("Independent bounded schedule combinations:", count);
});
test("calculation never mutates input and accepts intentional trim normalization", () => {
  const raw = Object.freeze({players:" 4 ", minutes:" 120 ", duration:"30", breaks:true});
  assert.deepEqual(calculatePlan(raw), validCases[0].expected);
});
