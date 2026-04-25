'use client';

import { useState } from 'react';
import { containsVariable } from '@/lib/admin/split-template';
import type { TemplateBlock } from '@/lib/admin/template-actions';
import type { RequiredVariable } from '@/lib/admin/preset-variables';

interface Props {
  blocks: TemplateBlock[];
  onChange: (blocks: TemplateBlock[]) => void;
  variables: RequiredVariable[];
}

export function ContentEditor({ blocks, onChange, variables }: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function handleCopy(key: string) {
    await navigator.clipboard.writeText(`{{${key}}}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  function updateBlock(index: number, patch: Partial<TemplateBlock>) {
    const next = blocks.map((b, i) => (i === index ? { ...b, ...patch } : b));
    onChange(next);
  }

  function addBlock(type: 'static' | 'dynamic') {
    onChange([...blocks, { segment_type: type, text: '' }]);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {/* Block list */}
      {blocks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-500">
          Chưa có block nào. Bấm nút bên dưới để thêm block đầu tiên.
        </div>
      ) : (
        blocks.map((block, idx) => (
          <BlockEditor
            key={idx}
            block={block}
            index={idx}
            total={blocks.length}
            onUpdate={(patch) => updateBlock(idx, patch)}
            onRemove={() => removeBlock(idx)}
            onMoveUp={() => moveBlock(idx, 'up')}
            onMoveDown={() => moveBlock(idx, 'down')}
          />
        ))
      )}

      {/* Add block buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => addBlock('static')}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          <span>+</span> Thêm block <strong>Cố định</strong> (static)
        </button>
        <button
          type="button"
          onClick={() => addBlock('dynamic')}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 py-3 text-sm font-medium text-amber-700 hover:bg-amber-50"
        >
          <span>+</span> Thêm block <strong>Cá nhân hóa</strong> (dynamic)
        </button>
      </div>

      {/* Variable reference — copy quick */}
      {variables.length > 0 && (
        <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">
            Biến đã chọn — Click để copy, paste vào block dynamic
          </p>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => handleCopy(v.key)}
                className="group flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs transition hover:border-amber-400 hover:bg-amber-50"
              >
                <code className="font-mono text-stone-700 group-hover:text-amber-700">
                  {`{{${v.key}}}`}
                </code>
                <span className="text-stone-400">·</span>
                <span className="text-stone-600">{v.label}</span>
                {copiedKey === v.key && <span className="text-emerald-600">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ BLOCK EDITOR ============

interface BlockProps {
  block: TemplateBlock;
  index: number;
  total: number;
  onUpdate: (patch: Partial<TemplateBlock>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function BlockEditor({
  block,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: BlockProps) {
  const isStatic = block.segment_type === 'static';
  const hasVariable = containsVariable(block.text);
  const isStaticWithVar = isStatic && hasVariable;

  const colorClasses = isStatic
    ? 'border-emerald-300 bg-emerald-50/30 focus-within:border-emerald-500'
    : 'border-amber-300 bg-amber-50/30 focus-within:border-amber-500';

  const warningClass = isStaticWithVar
    ? 'border-red-400 bg-red-50/30 focus-within:border-red-500'
    : '';

  return (
    <div
      className={`rounded-xl border-2 p-3 transition ${warningClass || colorClasses}`}
    >
      {/* Block header */}
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-stone-500">
          #{index + 1}
        </span>
        <select
          value={block.segment_type}
          onChange={(e) =>
            onUpdate({ segment_type: e.target.value as 'static' | 'dynamic' })
          }
          className="rounded-md border border-stone-300 bg-white px-2 py-1 text-xs font-medium"
        >
          <option value="static">🔒 Cố định (cache, share mọi user)</option>
          <option value="dynamic">⚡ Cá nhân hóa (gen riêng theo biến)</option>
        </select>

        <div className="flex-1" />

        {/* Move up/down */}
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          title="Di chuyển lên"
          className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700 disabled:opacity-30"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          title="Di chuyển xuống"
          className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700 disabled:opacity-30"
        >
          ▼
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Xóa block"
          className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
        >
          ✕
        </button>
      </div>

      {/* Block textarea */}
      <textarea
        value={block.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        rows={isStatic ? 6 : 3}
        spellCheck={false}
        placeholder={
          isStatic
            ? 'Nội dung cố định, không thay đổi giữa các user. Pregen 1 lần cache chung.'
            : 'Nội dung có chứa biến {{...}}. Gen riêng cho từng user theo profile.'
        }
        className="w-full resize-y rounded-lg border border-stone-200 bg-white p-3 font-serif text-sm leading-relaxed text-stone-800 focus:outline-none"
      />

      {/* Warning: static có biến */}
      {isStaticWithVar && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          ⚠️ <strong>Cảnh báo:</strong> Block <strong>cố định</strong> đang chứa biến{' '}
          <code className="rounded bg-white px-1">{`{{...}}`}</code>. Audio cache 1
          lần xài chung mọi user → biến sẽ KHÔNG được thay → đọc literal{' '}
          <code className="rounded bg-white px-1">{`{{owner_name}}`}</code> trong
          audio. Bạn vẫn có thể lưu, nhưng cân nhắc đổi sang block cá nhân hóa.
        </div>
      )}
    </div>
  );
}