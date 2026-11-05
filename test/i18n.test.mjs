import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  intlLocale,
  LOCALES,
  locales,
  stripLocale,
  useTranslations,
} from '~/lib/i18n';

test('stripLocale removes only a real locale prefix', () => {
  assert.equal(stripLocale('/'), '/');
  assert.equal(stripLocale('/en'), '/');
  assert.equal(stripLocale('/en/'), '/');
  assert.equal(stripLocale('/es/podcast/'), '/podcast/');
  assert.equal(stripLocale('/podcast/'), '/podcast/');
  // A path that merely starts with the letters is not a locale.
  assert.equal(stripLocale('/english/'), '/english/');
});

test('intlLocale maps locales and defaults to pt-BR', () => {
  assert.equal(intlLocale('en'), 'en-US');
  assert.equal(intlLocale('es'), 'es-ES');
  assert.equal(intlLocale('xx'), 'pt-BR');
});

test('useTranslations falls back to pt-BR for an unknown locale', () => {
  assert.equal(useTranslations('xx')('nav.home'), locales['pt-BR']['nav.home']);
});

test('every locale has exactly the pt-BR keys, none empty', () => {
  const reference = Object.keys(locales['pt-BR']).sort();
  for (const locale of LOCALES) {
    const dict = locales[locale];
    assert.deepEqual(Object.keys(dict).sort(), reference, `keys of ${locale}`);
    for (const [key, value] of Object.entries(dict)) {
      assert.ok(value.trim(), `${locale} ${key} is empty`);
    }
  }
});
