'use client';

import { useMemo, useState } from 'react';
import { FrequencyTabs, type FrequencyTab } from './FrequencyTabs';
import { AudioStatusList } from './AudioStatusBadge';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { TemplateEditor } from './TemplateEditor';
import { GenAudioModal } from './GenAudioModal';
import {
  deleteTemplate,
  getTemplate,
  type TemplateDetail,
  type TemplateListItem,
} from '@/lib/admin/template-actions';
import { useRouter } from 'next/navigation';

interface VoiceMeta {
  voice_key: string;
  voice_label: string;
  provider_voice_id: string;
}

interface Props {
  initialTemplates: TemplateListItem[];
  voicesMeta: VoiceMeta[];
}

export function TemplateList({ initialTemplates, voicesMeta }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FrequencyTab>('all');

  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDetail | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TemplateListItem | null>(null);
  const [genTarget, setGenTarget] = useState<TemplateListItem | null>(null);

  const filtered = useMemo(() => {
    return initialTemplates.filter((t) => {
      if (!t.is_active) return false;
      if (activeTab !== 'all' && t.frequency !== activeTab) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialTemplates, search, activeTab]);

  const counts = useMemo(() => {
    const c: Partial<Record<FrequencyTab, number>> = { all: 0 };
    for (const t of initialTemplates) {
      if (!t.is_active) continue;
      c.all = (c.all ?? 0) + 1;
      c[t.frequency] = (c[t.frequency] ?? 0) + 1;
    }
    return c;
  }, [initialTemplates]);

  async function handleEdit(item: TemplateListItem) {
    setLoadingEdit(true);
    const res = await getTemplate(item.id);
    setLoadingEdit(false);
    if (!res.ok || !res.data) {
      alert(res.error ?? 'Lỗi load template');
      return;
    }
    setEditingTemplate(res.data);
    setEditorMode('edit');
  }

  function handleCreate() {
    setEditingTemplate(null);
    setEditorMode('create');
  }

  function handleEditorClose() {
    setEditorMode(null);
    setEditingTemplate(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const res = await deleteTemplate(deleteTarget.id);
    if (!res.ok) {
      throw new Error(res.error ?? 'Lỗi xóa');
    }
    router.refresh();
  }

  return (
    <>
      {/* Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, slug, category..."
            className="w-full flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700"
          >
            <span className="text-lg">+</span> Thêm văn khấn
          </button>
        </div>

        <FrequencyTabs active={activeTab} onChange={setActiveTab} counts={counts} />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-400">
          Không có template nào. {search && 'Thử đổi từ khóa tìm.'}
        </div>
      )}

      {/* Desktop: Table view (>=1024px) */}
      {filtered.length > 0 && (
        <div className="mt-6 hidden overflow-hidden rounded-xl border border-stone-200 bg-white lg:block">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50/50 text-left text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Tên văn khấn</th>
                <th className="px-4 py-3 font-medium">Phân loại</th>
                <th className="px-4 py-3 font-medium">Audio status</th>
                <th className="px-4 py-3 font-medium">Segments</th>
                <th className="px-4 py-3 text-right font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900">
                      {t.title}
                      {t.is_featured && (
                        <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                      <code className="font-mono">{t.slug}</code>
                      <span>·</span>
                      <span>{t.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{frequencyLabel(t.frequency)}</td>
                  <td className="px-4 py-3">
                    <AudioStatusList statuses={t.audio_status} />
                  </td>
                  <td className="px-4 py-3 text-stone-600">{t.segment_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setGenTarget(t)}
                        className="rounded px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                      >
                        Gen
                      </button>
                      <button
                        onClick={() => handleEdit(t)}
                        disabled={loadingEdit}
                        className="rounded px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="rounded px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile/Tablet: Card view (<1024px) */}
      {filtered.length > 0 && (
        <div className="mt-6 space-y-3 lg:hidden">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium text-stone-900">{t.title}</h3>
                    {t.is_featured && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                    <code className="truncate font-mono">{t.slug}</code>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span className="rounded-full bg-stone-100 px-2 py-0.5">
                  {frequencyLabel(t.frequency)}
                </span>
                <span>·</span>
                <span>{t.category}</span>
                <span>·</span>
                <span>{t.segment_count} segments</span>
              </div>

              {/* Audio status */}
              <div className="mt-3">
                <AudioStatusList statuses={t.audio_status} />
              </div>

              {/* Actions — full width buttons mobile */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setGenTarget(t)}
                  className="rounded-lg border border-amber-300 bg-amber-50 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100"
                >
                  Gen
                </button>
                <button
                  onClick={() => handleEdit(t)}
                  disabled={loadingEdit}
                  className="rounded-lg border border-stone-300 bg-white py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Sửa
                </button>
                <button
                  onClick={() => setDeleteTarget(t)}
                  className="rounded-lg border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateEditor
        open={editorMode !== null}
        mode={editorMode ?? 'create'}
        template={editingTemplate}
        onClose={handleEditorClose}
        onSaved={() => router.refresh()}
      />

      <DeleteConfirmModal
        open={deleteTarget !== null}
        templateTitle={deleteTarget?.title ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <GenAudioModal
        open={genTarget !== null}
        template={genTarget}
        voicesMeta={voicesMeta}
        onClose={() => setGenTarget(null)}
        onDone={() => router.refresh()}
      />
    </>
  );
}

function frequencyLabel(f: string): string {
  switch (f) {
    case 'monthly':
      return 'Định kỳ';
    case 'yearly':
      return 'Thường niên';
    case 'rare':
      return 'Hiếm';
    default:
      return 'Khác';
  }
}