
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Modal } from '../views/modals/Modal.mjs';

test('ModalManager resolves modal open', async (t) => {
  // When running in browser, Modal will create DOM elements.
  const res = await Modal.open({ type: 'intro_find_rome', once: true });
  assert.ok(res && (res.skipped || res.acknowledged), 'Modal did not resolve as expected');
});
