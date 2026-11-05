import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeXmlEntities, xmlText } from '~/lib/xml';

test('decodes each entity exactly once', () => {
  // The chained-replace decoder this replaced turned `&amp;lt;` into `<`.
  assert.equal(decodeXmlEntities('a &amp;lt; b'), 'a &lt; b');
  assert.equal(decodeXmlEntities('&amp;amp;'), '&amp;');
});

test('decodes the predefined entities', () => {
  assert.equal(
    decodeXmlEntities('&lt;b&gt; &quot;q&quot; &apos;a&apos; &amp;'),
    '<b> "q" \'a\' &',
  );
});

test('decodes decimal and hex character references', () => {
  assert.equal(decodeXmlEntities('caf&#233; &#xE9; &#x1F680;'), 'café é 🚀');
});

test('leaves unknown and invalid references untouched', () => {
  assert.equal(
    decodeXmlEntities('&nbsp; &bogus; &#0; & alone'),
    '&nbsp; &bogus; &#0; & alone',
  );
});

test('xmlText takes CDATA verbatim and trims', () => {
  assert.equal(xmlText('  <![CDATA[Tom &amp; Jerry]]>  '), 'Tom &amp; Jerry');
});

test('xmlText decodes only outside CDATA', () => {
  assert.equal(xmlText('A &amp; <![CDATA[<b> &lt;]]> z'), 'A & <b> &lt; z');
});
