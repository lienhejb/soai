'use client';

import { useMemo, useState } from 'react';
import { FrequencyTabs, type FrequencyTab } from './FrequencyTabs';
import { AudioStatusList } from './AudioStatusBadge';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { TemplateEditor } from './TemplateEditor';
import {
  deleteTemplate,
  getTemplate,
  type TemplateDetail,
  type TemplateListItem,
} from '@/lib/admin/template-actions';
import { useRouter } from 'next/navigation';

interface Props {
  initialTemplates: TemplateListItem[];
}

export function TemplateList({ initialTemplates }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FrequencyTab>('all');

  // Editor state
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateDetail | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<TemplateListItem | null>(null);

  // Filter + search
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

  // Counts per tab
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
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, slug, category..."
            className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700"
          >
            <span className="text-lg">+</span> Thêm văn khấn
          </button>
        </div>

        <FrequencyTabs active={activeTab} onChange={setActiveTab} counts={counts} />
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white">
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  Không có template nào. {search && 'Thử đổi từ khóa tìm.'}
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
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
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(t)}
                      disabled={loadingEdit}
                      className="rounded px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="ml-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor */}
      <TemplateEditor
        open={editorMode !== null}
        mode={editorMode ?? 'create'}
        template={editingTemplate}
        onClose={handleEditorClose}
        onSaved={() => router.refresh()}
      />

      {/* Delete confirm */}
      <DeleteConfirmModal
        open={deleteTarget !== null}
        templateTitle={deleteTarget?.title ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

function frequencyLabel(f: string): string {
  switch (f) {
    case 'monthly': return 'Định kỳ';
    case 'yearly': return 'Thường niên';
    case 'rare': return 'Hiếm';
    default: return 'Khác';
  }
}