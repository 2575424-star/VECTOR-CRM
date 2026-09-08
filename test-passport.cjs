const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('passport-parser.js','utf8'),ctx);
const sample=`Фамилия: ТЕСТОВ
Имя: ИВАН
Отчество: ПЕТРОВИЧ
Дата рождения: 01.02.1990
Место рождения: ТЕСТОВЫЙ ГОРОД
Гражданство: РОССИЙСКАЯ ФЕДЕРАЦИЯ
Паспорт: 00 01 №000123
Дата выдачи: 03.04.2020
Код подразделения: 000-001
Кем выдан: ТЕСТОВОЕ УПРАВЛЕНИЕ
Адрес регистрации: ТЕСТОВЫЙ ГОРОД
УЛИЦА ПРИМЕРНАЯ ДОМ 1`;
const a=ctx.parsePassportText(sample).fields;
assert.equal(a.full_name,'ТЕСТОВ ИВАН ПЕТРОВИЧ');assert.equal(a.birth_date,'1990-02-01');assert.equal(a.passport_number,'000123');assert.equal(a.passport_series,'0001');assert.equal(a.passport_issued_at,'2020-04-03');assert.equal(a.passport_department_code,'000-001');assert.match(a.registration_address,/ДОМ 1/);
const b=ctx.parsePassportText('ID0001234\nПИН: 00000000000000\nДата рождения: 31.02.1990').fields;assert.equal(b.passport_number,'ID0001234');assert.equal(b.personal_number,'00000000000000');assert.equal(b.birth_date,undefined);
assert.equal(Object.keys(ctx.parsePassportText('НЕЧИТАЕМЫЙ ТЕКСТ\n123').fields).length,0);
const c=ctx.parsePassportText('Surname: TEST\nGiven names: JOHN\nDate of birth: 01/02/1990').fields;assert.equal(c.full_name,'TEST JOHN');assert.equal(c.birth_date,'1990-02-01');
console.log('PASS: labelled RU/EN fields, dates, leading zeros, ID/PIN, missing/invalid data stays empty.');
