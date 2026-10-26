"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("phone validation accepts only the exact Ukrainian format without modifying input", () => {
  const filename = path.join(__dirname, "../js/validation.js");
  assert.ok(fs.existsSync(filename), "Feedback validation module has not been implemented yet");
  const { validatePhone } = require(filename);
  assert.equal(typeof validatePhone, "function");
  for (const input of ["+380000000000", "+380501234567"]) {
    assert.equal(validatePhone(input).valid, true, input);
  }
  for (const input of ["", "0501234567", "+380", "+38000000000", "+3800000000000", "+380 50 123 45 67", "+380(50)1234567", "+380abc123456", " +380000000000", "+380000000000 ", "+380000000000\n"]) {
    const result = validatePhone(input);
    assert.equal(result.valid, false, input);
    assert.equal(typeof result.message, "string");
    assert.ok(result.message.length > 0);
  }
});


test("email validation enforces the documented ASCII dot-atom contract", () => {
  const { validateEmail } = require("../js/validation.js");
  assert.equal(typeof validateEmail, "function", "Email validator has not been implemented yet");
  for (const input of ["player@example.com", "first.last+tag@sub.example.technology", "  a@example.com  ", "a".repeat(64)+"@example.com"]) {
    const result=validateEmail(input);assert.equal(result.valid,true,input);assert.equal(result.message,"");
  }
  for (const input of ["", "x", "@example.com", ".x@example.com", "x.@example.com", "x..y@example.com", "x@@example.com", "x@example..com", "x@-example.com", "x@example-.com", "x@exa mple.com", "імя@example.com", "a".repeat(65)+"@example.com", "x@"+"a".repeat(64)+".com", null, undefined, 42]) {
    const result=validateEmail(input);assert.equal(result.valid,false,String(input));assert.ok(result.message);
  }
});


test("name validation counts Unicode graphemes and accepts genuine name separators", () => {
  const { validateName } = require("../js/validation.js");
  assert.equal(typeof validateName,"function","Name validator has not been implemented yet");
  for (const input of ["Олена", "Jean-Luc", "МаріяʼЯна", "李四", "E\u0301B", "A".repeat(100), "  Іван  ", "Jean‑Luc", "Марія‘Яна"]) {
    const result=validateName(input);assert.equal(result.valid,true,input);assert.equal(result.message,"");
  }
  for (const input of ["", "A", "e\u0301", "Іван2", "😀😀", "----", "ʼʼ", "Іванʼ", "<b>Іван</b>", "\u0301AB", "A".repeat(101), null, undefined, 42]) {
    const result=validateName(input);assert.equal(result.valid,false,String(input));assert.ok(result.message);
  }
});


test("message validation enforces grapheme limits while treating content as plain text", () => {
  const { validateMessage } = require("../js/validation.js");
  assert.equal(typeof validateMessage,"function","Message validator has not been implemented yet");
  for (const input of ["1234567890", "  Повідомлення для демо  ", "😀".repeat(10), "e\u0301".repeat(10), "A".repeat(2000), "<img src=x onerror=alert(1)>", "Текст першого рядка\nДругий рядок"]) {
    const result=validateMessage(input);assert.equal(result.valid,true,input);assert.equal(result.message,"");
  }
  for (const input of ["", "         ", "123456789", "😀".repeat(9), "e\u0301".repeat(9), "A".repeat(2001), null, undefined, 42]) {
    const result=validateMessage(input);assert.equal(result.valid,false,String(input));assert.ok(result.message);
  }
});


test("agreement validation requires an actual boolean checked state", () => {
  const { validateAgreement } = require("../js/validation.js");
  assert.equal(typeof validateAgreement,"function","Agreement validator has not been implemented yet");
  assert.deepEqual(validateAgreement(true),{valid:true,message:""});
  for (const input of [false,"true",1,0,null,undefined,{}]) {
    const result=validateAgreement(input);assert.equal(result.valid,false,String(input));assert.ok(result.message);
  }
});
