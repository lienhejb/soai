'use client';

import { useEffect, useState } from 'react';
import { ContentEditor } from './ContentEditor';
import { VariableSelector } from './VariableSelector';
import { SlugWarningModal } from './SlugWarningModal';
import {
  createTemplate,
  updateTemplate,
  type Frequency,
  type TemplateDetail,
  type TemplateInput,
} from '@/lib/admin/template-actions';
import type { RequiredVariable } from '@/lib/admin/preset-variables';

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  template?: TemplateDetail | null; // chỉ có khi mode='edit'
  onClose: () => void;
  onSaved: () => void;
}

const FREQUENCY_OPTIONS: Array<{ value: Frequency; label: string }> = [
  { value: 'monthly', label: 'Định kỳ (Hàng tháng)' },
  { value: 'yearly', label: 'Thường niên (Hàng năm)' },
  { value: 'rare', label: 'Hiếm (Sự kiện)' },
  { value: 'other', label: 'Khác' },
];

export function TemplateEditor({ open, mode, template, onClose, onSaved }: Props) {
  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('ritual');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [content, setContent] = useState('');
  const [variables, setVariables] = useState<RequiredVariable[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSlugWarning, setShowSlugWarning] = useState(false);

  // Init khi mở dialog
  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && template) {
      setTitle(template.title);
      setSlug(template.slug);
      setCategory(template.category);
      setFrequency(template.frequency);
      setContent(template.content);
      setVariables(template.required_variables);
      setIsFeatured(template.is_featured);
    } else {
      setTitle('');
      setSlug('');
      setCategory('ritual');
      setFrequency('monthly');
      setContent('');
      setVariables([]);
      setIsFeatured(false);
    }
    setError(null);
  }, [open, mode, template]);

  if (!open) return null;

  function buildInput(): TemplateInput {
    return {
      title: title.trim(),
      slug: slug.trim(),
      category: category.trim() || 'ritual',
      frequency,
      content: content.trim(),
      required_variables: variables,
      is_featured: isFeatured,
    };
  }

  async function handleSave() {
    setError(null);

    // Slug đổi → hiện warning trước
    if (mode === 'edit' && template && slug.trim() !== template.slug) {
      setShowSlugWarning(true);
      return;
    }

    await doSave();
  }

  async function doSave() {
    setSaving(true);
    setError(null);
    try {
      const input = buildInput();
      const res = mode === 'create'
        ? await createTemplate(input)
        : await updateTemplate(template!.id, input);

      if (!res.ok) {
        setError(res.error ?? 'Lỗi không xác định');
        return;
      }

      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setSaving(false);
    }
  }

  // Auto-suggest slug from title (chỉ khi create)
  function handleTitleChange(v: string) {
    setTitle(v);
    if (mode === 'create' && !slug.trim()) {
      const auto = slugify(v);
      if (auto) setSlug(auto);
    }
  }

  const isEditMode = mode === 'edit' && template;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={!saving ? onClose : undefined}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col bg-stone-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              {mode === 'create' ? 'Thêm văn khấn mới' : 'Chỉnh sửa văn khấn'}
            </h2>
            {isEditMode && (
              <p className="mt-1 text-xs text-stone-500">
                UUID: <code className="font-mono">{template.id}</code>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="text-sm font-medium text-stone-700">Tiêu đề *</label>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="VD: Văn khấn Rằm hàng tháng"
                className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* Slug + Frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700">
                  Slug (URL) *
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="khan-ram-hang-thang"
                  className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
                <p className="mt-1 text-xs text-stone-500">
                  Chỉ chữ thường, số, gạch ngang. Đổi sẽ làm link cũ chết.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700">Phân loại *</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                  className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category + Featured */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700">
                  Loại nội dung
                </label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="VD: Gia tiên, Thần tài, Phật"
                  className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="flex items-center pt-7">
                <label className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300"
                  />
                  Nổi bật (hiển thị trên dashboard)
                </label>
              </div>
            </div>

            {/* Variables */}
            <div>
              <label className="text-sm font-medium text-stone-700">
                Biến cần thiết
              </label>
              <p className="mt-0.5 text-xs text-stone-500">
                Khai báo các biến template này dùng. User sẽ điền (hoặc auto fill từ profile).
              </p>
              <div className="mt-2">
                <VariableSelector selected={variables} onChange={setVariables} />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="text-sm font-medium text-stone-700">
                Nội dung văn khấn *
              </label>
              <p className="mt-0.5 text-xs text-stone-500">
                Hệ thống sẽ tự tách thành các đoạn cố định (cache chung) và đoạn cá nhân hóa (gen riêng cho user).
              </p>
              <div className="mt-2">
                <ContentEditor
                  value={content}
                  onChange={setContent}
                  variables={variables}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer — sticky */}
        <div className="flex items-center justify-end gap-2 border-t border-stone-200 bg-white px-6 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo văn khấn' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Slug warning modal */}
      {isEditMode && (
        <SlugWarningModal
          open={showSlugWarning}
          oldSlug={template.slug}
          newSlug={slug.trim()}
          templateUuid={template.id}
          onClose={() => setShowSlugWarning(false)}
          onConfirm={doSave}
        />
      )}
    </>
  );
}

/**
 * Slugify tiếng Việt → ASCII slug
 * "Văn khấn Rằm hàng tháng" → "van-khan-ram-hang-thang"
 */
function slugify(text: string): string {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
    .replace(/đ/g, 'd');

  return normalized
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}