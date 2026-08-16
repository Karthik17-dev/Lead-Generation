import { describe, expect, test } from 'bun:test';

import { modelItemValue, pickerGroupId, pickerGroupLabel, splitModelLabel } from './model-grouping';
import type { FlatModel } from './session-chat-input';

// Regression coverage for the "every provider shows as Zed" picker bug.
//
// Root cause: the gateway exposes its ENTIRE catalog under one synthetic
// `zed` opencode provider. `pickerGroupId` always correctly split the
// grouping KEY out of the wire model id, but the group's DISPLAY LABEL was
// built from `model.providerName` — which is opencode's raw provider name,
// ALWAYS "Zed" for every model, since there is only one registered
// provider. So the icon rendered under the right provider but every group's
// text label still read "Zed". The fix is two-fold: prefer the explicit
// `provider` field the gateway now serves (never string-split when it's
// present) for the grouping key, AND resolve the display label from
// PROVIDER_LABELS keyed by that REAL id — never from the raw providerName.
function model(partial: Partial<FlatModel> & Pick<FlatModel, 'providerID' | 'modelID'>): FlatModel {
  return {
    providerName: 'Zed',
    modelName: partial.modelID,
    ...partial,
  };
}

describe('pickerGroupId', () => {
  test('prefers the explicit `provider` field over string-splitting the wire id', () => {
    const m = model({
      providerID: 'zed',
      modelID: 'anthropic/claude-opus-4-8',
      provider: 'anthropic',
    });
    expect(pickerGroupId(m)).toBe('anthropic');
  });

  test('falls back to splitting modelID on "/" when `provider` is absent (stale catalog)', () => {
    const m = model({ providerID: 'zed', modelID: 'openai/gpt-5.6-sol' });
    expect(pickerGroupId(m)).toBe('openai');
  });

  test('a managed bare-id model (no slash, no explicit provider) groups under zed', () => {
    const m = model({ providerID: 'zed', modelID: 'claude-opus-4.8' });
    expect(pickerGroupId(m)).toBe('zed');
  });

  test('a branded managed DeepSeek model groups under deepseek for its provider icon', () => {
    const m = model({
      providerID: 'zed',
      modelID: 'deepseek-v4-flash',
      provider: 'deepseek',
    });
    expect(pickerGroupId(m)).toBe('deepseek');
    expect(pickerGroupLabel(pickerGroupId(m), m)).toBe('DeepSeek');
  });

  test('a codex/<id> model groups under its own `codex` provider, distinct from `openai`', () => {
    const m = model({ providerID: 'zed', modelID: 'codex/gpt-5.6-sol', provider: 'codex' });
    expect(pickerGroupId(m)).toBe('codex');
  });

  test('a non-gateway (native) provider model groups under its own providerID unchanged', () => {
    const m = model({
      providerID: 'anthropic',
      modelID: 'claude-opus-4-8',
      providerName: 'Anthropic',
    });
    expect(pickerGroupId(m)).toBe('anthropic');
  });
});

describe('pickerGroupLabel — THE actual display-name bug fix', () => {
  test('labels an Anthropic BYOK group "Anthropic", never the raw (always-"Zed") providerName', () => {
    const m = model({
      providerID: 'zed',
      modelID: 'anthropic/claude-opus-4-8',
      provider: 'anthropic',
      providerName: 'Zed', // what opencode's raw provider object always reports
    });
    const groupID = pickerGroupId(m);
    expect(pickerGroupLabel(groupID, m)).toBe('Anthropic');
    expect(pickerGroupLabel(groupID, m)).not.toBe('Zed');
  });

  test('labels an OpenAI BYOK group "OpenAI"', () => {
    const m = model({ providerID: 'zed', modelID: 'openai/gpt-5.6-sol', provider: 'openai' });
    expect(pickerGroupLabel(pickerGroupId(m), m)).toBe('OpenAI');
  });

  test('labels the managed group "Zed" (correctly, since it really is Zed)', () => {
    const m = model({ providerID: 'zed', modelID: 'claude-opus-4.8' });
    expect(pickerGroupLabel(pickerGroupId(m), m)).toBe('Zed');
  });

  test('falls back to the raw providerName for a truly unrecognized provider id', () => {
    const m = model({
      providerID: 'zed',
      modelID: 'some-new-provider/some-model',
      providerName: 'Zed',
    });
    // No PROVIDER_LABELS entry for "some-new-provider" -> falls back to
    // model.providerName rather than showing an ugly raw id.
    expect(pickerGroupLabel(pickerGroupId(m), m)).toBe('Zed');
  });
});

// Bedrock regression: models.dev's canonical provider id is `amazon-bedrock`
// and Bedrock wire ids are DOT-namespaced (`us.anthropic.claude-opus-4-8`),
// so there is no "/" to split on — the explicit `provider` field is the ONLY
// way to group them. PROVIDER_LABELS was missing the `amazon-bedrock` key, so
// the label lookup fell through to `providerName` ("Zed") and the whole
// BYOK Bedrock group rendered as "Zed" while showing the Bedrock icon.
describe('BYOK Bedrock grouping (dot-namespaced ids)', () => {
  const bedrockModelIDs = [
    'us.anthropic.claude-opus-4-8',
    'global.anthropic.claude-sonnet-5',
    'anthropic.claude-fable-5',
    'deepseek.v3.2',
  ];

  for (const modelID of bedrockModelIDs) {
    test(`groups ${modelID} under amazon-bedrock, labelled "Amazon Bedrock"`, () => {
      const m = model({ providerID: 'zed', modelID, provider: 'amazon-bedrock' });
      const groupID = pickerGroupId(m);
      expect(groupID).toBe('amazon-bedrock');
      expect(pickerGroupLabel(groupID, m)).toBe('Amazon Bedrock');
    });
  }

  test('the short `bedrock` alias resolves to the same label', () => {
    const m = model({
      providerID: 'zed',
      modelID: 'us.anthropic.claude-opus-4-8',
      provider: 'bedrock',
    });
    expect(pickerGroupLabel(pickerGroupId(m), m)).toBe('Amazon Bedrock');
  });

  test('WITHOUT the explicit provider field a dot-namespaced id degrades to zed', () => {
    // Documents exactly why `provider` must survive the wire: there is no "/"
    // to recover the real provider from, so the label would read "Zed".
    const m = model({ providerID: 'zed', modelID: 'us.anthropic.claude-opus-4-8' });
    expect(pickerGroupId(m)).toBe('zed');
  });
});

/**
 * The picker row renders one line in two tones — a bold lead and a muted
 * qualifier — in place of the old name-over-raw-id pair. These pin the split
 * itself; the render around it is in `model-selector.tsx`.
 */
describe('splitModelLabel', () => {
  test('splits a two-word name into bold lead + muted trail', () => {
    expect(splitModelLabel('Opus 5')).toEqual({ lead: 'Opus', trail: '5' });
    expect(splitModelLabel('Kimi K3')).toEqual({ lead: 'Kimi', trail: 'K3' });
  });

  test('a hyphenated/dotted first token stays whole in the lead', () => {
    // 'GPT-5.6' must not break at the hyphen or the dot — only whitespace
    // separates the two tones.
    expect(splitModelLabel('GPT-5.6 Sol')).toEqual({ lead: 'GPT-5.6', trail: 'Sol' });
  });

  test('a three-word name keeps everything after the first word together', () => {
    // The alternative — breaking at the last space — would render
    // "Claude Sonnet" bold and "5" muted, which reads as two different models.
    expect(splitModelLabel('Claude Sonnet 5')).toEqual({ lead: 'Claude', trail: 'Sonnet 5' });
  });

  test('a single-word name is all lead, never an empty bold half', () => {
    expect(splitModelLabel('Sonnet')).toEqual({ lead: 'Sonnet', trail: '' });
  });

  test('collapses surrounding and repeated whitespace', () => {
    expect(splitModelLabel('  Opus   5  ')).toEqual({ lead: 'Opus', trail: '5' });
  });

  test('undefined and empty names render nothing rather than throwing', () => {
    // `FlatModel.modelName` is typed as required, but this list is fed by a
    // wire catalog — a missing name must degrade to an empty row, not a crash.
    expect(splitModelLabel(undefined)).toEqual({ lead: '', trail: '' });
    expect(splitModelLabel('   ')).toEqual({ lead: '', trail: '' });
  });
});

/**
 * The account default renders twice — pinned at the top of the picker and again
 * in its provider group. cmdk drives filtering, arrow-key navigation and
 * `data-selected` off each row's `value`, and two rows sharing one value fails
 * SILENTLY: the highlight lands on both and nothing throws.
 */
describe('modelItemValue', () => {
  const model = { providerID: 'zed', modelID: 'anthropic/claude-opus-4-8' };

  test('the pinned copy and the in-group copy of one model never collide', () => {
    expect(modelItemValue('pinned', model)).not.toBe(modelItemValue('model', model));
  });

  test('two different models in the same scope never collide', () => {
    expect(modelItemValue('model', { providerID: 'zed', modelID: 'a' })).not.toBe(
      modelItemValue('model', { providerID: 'zed', modelID: 'b' }),
    );
  });

  test('the provider is part of the value, so the same model id under two providers differs', () => {
    expect(modelItemValue('model', { providerID: 'zed', modelID: 'gpt-5.6' })).not.toBe(
      modelItemValue('model', { providerID: 'openai', modelID: 'gpt-5.6' }),
    );
  });
});
