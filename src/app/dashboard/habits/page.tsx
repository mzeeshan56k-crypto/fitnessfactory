"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus, FolderPlus, Folder, MoreVertical, Trash2, ArrowRightLeft, ArrowDownUp,
  ListChecks, Pencil, Loader2, Check,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Modal, Field, EmptyState } from "@/components/ui/Modal";
import { useApp } from "@/lib/store";
import { habitIconKeys, habitIconFor, HabitIcon } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";

export default function MasterHabitsPage() {
  const app = useApp();
  const {
    habitFolders, masterHabits,
    addHabitFolder, renameHabitFolder, removeHabitFolder,
    addMasterHabit, updateMasterHabit, removeMasterHabits, moveHabitsToFolder,
    loadStarterHabits,
  } = app;

  const [folderId, setFolderId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Menus / modals
  const [folderMenu, setFolderMenu] = useState(false);
  const [moveMenu, setMoveMenu] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [habitModal, setHabitModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [folderName, setFolderName] = useState("");
  const [form, setForm] = useState({ name: "", description: "", icon: "check" });

  // Keep a valid selected folder as the library changes.
  useEffect(() => {
    if (habitFolders.length === 0) {
      if (folderId !== null) setFolderId(null);
      return;
    }
    if (!folderId || !habitFolders.some((f) => f.id === folderId)) {
      setFolderId(habitFolders[0].id);
    }
  }, [habitFolders, folderId]);

  // Reset selection when switching folders.
  useEffect(() => {
    setChecked(new Set());
  }, [folderId]);

  const activeFolder = habitFolders.find((f) => f.id === folderId) ?? null;

  const habitsInFolder = useMemo(() => {
    const list = masterHabits.filter((h) => h.folderId === folderId);
    list.sort((a, b) =>
      sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
    return list;
  }, [masterHabits, folderId, sortDir]);

  const allChecked = habitsInFolder.length > 0 && checked.size === habitsInFolder.length;

  if (!app.hydrated) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setChecked(allChecked ? new Set() : new Set(habitsInFolder.map((h) => h.id)));
  }

  function submitFolder() {
    const name = folderName.trim();
    if (!name) return;
    const f = addHabitFolder(name);
    setFolderId(f.id);
    setFolderName("");
    setAddFolderOpen(false);
  }
  function submitRename() {
    if (!activeFolder) return;
    const name = folderName.trim();
    if (!name) return;
    renameHabitFolder(activeFolder.id, name);
    setRenameOpen(false);
  }
  function confirmDeleteFolder() {
    if (!activeFolder) return;
    removeHabitFolder(activeFolder.id);
    setDeleteFolderOpen(false);
  }

  function openCreate() {
    if (!folderId) return;
    setEditingId(null);
    setForm({ name: "", description: "", icon: "check" });
    setHabitModal(true);
  }
  function openEdit(id: string) {
    const h = masterHabits.find((x) => x.id === id);
    if (!h) return;
    setEditingId(id);
    setForm({ name: h.name, description: h.description, icon: h.icon });
    setHabitModal(true);
  }
  function submitHabit() {
    if (!form.name.trim() || !folderId) return;
    if (editingId) {
      updateMasterHabit(editingId, {
        name: form.name.trim(), description: form.description.trim(), icon: form.icon,
      });
    } else {
      addMasterHabit({
        folderId, name: form.name.trim(), description: form.description.trim(), icon: form.icon,
      });
    }
    setHabitModal(false);
  }

  function deleteChecked() {
    if (checked.size === 0) return;
    removeMasterHabits([...checked]);
    setChecked(new Set());
  }
  function moveChecked(toFolderId: string) {
    if (checked.size === 0) return;
    moveHabitsToFolder([...checked], toFolderId);
    setChecked(new Set());
    setMoveMenu(false);
  }

  return (
    <>
      <PageHeader
        title="Master Habits"
        subtitle="Build reusable habit templates, organized in folders, to assign to your clients."
        action={
          <button className="btn-primary" onClick={openCreate} disabled={!folderId}>
            <Plus className="h-4 w-4" />
            New habit
          </button>
        }
      />

      {habitFolders.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No habit folders yet"
          description="Load the starter Master Habits library (Nutrition, Mindfulness, Sleep and more) or create your own folder to begin."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <button className="btn-primary" onClick={loadStarterHabits}>
                <ListChecks className="h-4 w-4" />
                Load starter habits
              </button>
              <button className="btn-secondary" onClick={() => { setFolderName(""); setAddFolderOpen(true); }}>
                <FolderPlus className="h-4 w-4" />
                Add folder
              </button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Folders pane */}
          <div className="card h-fit p-3">
            <div className="flex items-center justify-between px-2 py-1.5">
              <h2 className="text-sm font-semibold text-ink-900">Folders</h2>
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-500"
                onClick={() => { setFolderName(""); setAddFolderOpen(true); }}
              >
                <FolderPlus className="h-3.5 w-3.5" /> Add Folder
              </button>
            </div>
            <div className="mt-1 space-y-0.5">
              {habitFolders.map((f) => {
                const active = f.id === folderId;
                const count = masterHabits.filter((h) => h.folderId === f.id).length;
                return (
                  <div key={f.id} className="relative">
                    <button
                      onClick={() => setFolderId(f.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                        active
                          ? "bg-brand-500/15 text-brand-400"
                          : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                      )}
                    >
                      <Folder className={cn("h-4 w-4 shrink-0", active ? "text-brand-400" : "text-ink-400")} />
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className={cn("text-xs", active ? "text-brand-400/80" : "text-ink-400")}>{count}</span>
                      {active && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); setFolderMenu((v) => !v); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setFolderMenu((v) => !v); } }}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                          aria-label="Folder options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                    {active && folderMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setFolderMenu(false)} />
                        <div className="absolute right-2 top-11 z-20 w-40 overflow-hidden rounded-xl border border-ink-100 bg-ink-100 py-1 shadow-2xl">
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                            onClick={() => { setFolderMenu(false); setFolderName(f.name); setRenameOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" /> Rename
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10"
                            onClick={() => { setFolderMenu(false); setDeleteFolderOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habits pane */}
          <div className="card overflow-visible">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 px-4 py-3">
              <button
                onClick={toggleAll}
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded border transition",
                  allChecked ? "border-brand-500 bg-brand-500 text-white" : "border-ink-300 text-transparent hover:border-ink-400",
                )}
                aria-label={allChecked ? "Deselect all" : "Select all"}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button className="btn-primary" onClick={openCreate}>
                <Plus className="h-4 w-4" /> New
              </button>

              {/* Move */}
              <div className="relative">
                <button
                  className="btn-secondary"
                  disabled={checked.size === 0}
                  onClick={() => setMoveMenu((v) => !v)}
                >
                  <ArrowRightLeft className="h-4 w-4" /> Move
                </button>
                {moveMenu && checked.size > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMoveMenu(false)} />
                    <div className="absolute left-0 top-11 z-20 w-52 overflow-hidden rounded-xl border border-ink-100 bg-ink-100 py-1 shadow-2xl">
                      <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
                        Move {checked.size} to…
                      </div>
                      {habitFolders.filter((f) => f.id !== folderId).map((f) => (
                        <button
                          key={f.id}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                          onClick={() => moveChecked(f.id)}
                        >
                          <Folder className="h-4 w-4 text-ink-400" /> {f.name}
                        </button>
                      ))}
                      {habitFolders.filter((f) => f.id !== folderId).length === 0 && (
                        <div className="px-3 py-2 text-sm text-ink-400">No other folders</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 text-ink-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                disabled={checked.size === 0}
                onClick={deleteChecked}
                aria-label="Delete selected"
                title="Delete selected"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="ml-auto flex items-center gap-2 text-sm text-ink-500">
                <span className="hidden sm:inline">Sort by</span>
                <button
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 text-ink-500 transition hover:bg-ink-50"
                  aria-label={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
                  title={`Name ${sortDir === "asc" ? "A→Z" : "Z→A"}`}
                >
                  <ArrowDownUp className="h-4 w-4" />
                </button>
                <span className="rounded-xl border border-ink-200 px-3 py-1.5 font-medium text-ink-700">Name</span>
              </div>
            </div>

            {/* Column header */}
            <div className="hidden items-center gap-3 border-b border-ink-100 px-4 py-2 text-xs font-medium uppercase tracking-wide text-ink-400 sm:flex">
              <span className="w-5" />
              <span className="w-10" />
              <span>Name</span>
            </div>

            {/* Rows */}
            {habitsInFolder.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-ink-400">
                  No habits in {activeFolder?.name ?? "this folder"} yet.
                </p>
                <button className="btn-primary mt-4 inline-flex" onClick={openCreate}>
                  <Plus className="h-4 w-4" /> New habit
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-ink-100">
                {habitsInFolder.map((h) => {
                  const isChecked = checked.has(h.id);
                  return (
                    <li
                      key={h.id}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-3.5 transition",
                        isChecked ? "bg-brand-50/40" : "hover:bg-ink-50/60",
                      )}
                    >
                      <button
                        onClick={() => toggleCheck(h.id)}
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                          isChecked ? "border-brand-500 bg-brand-500 text-white" : "border-ink-300 text-transparent hover:border-ink-400",
                        )}
                        aria-label={isChecked ? `Deselect ${h.name}` : `Select ${h.name}`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
                        <HabitIcon icon={h.icon} className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => openEdit(h.id)}
                          className="text-left text-sm font-semibold text-brand-400 hover:underline"
                        >
                          {h.name}
                        </button>
                        {h.description && (
                          <p className="truncate text-sm text-ink-500">{h.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => openEdit(h.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 opacity-0 transition hover:bg-ink-100 hover:text-ink-700 group-hover:opacity-100"
                        aria-label={`Edit ${h.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Add folder modal */}
      <Modal
        open={addFolderOpen}
        onClose={() => setAddFolderOpen(false)}
        title="Add folder"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAddFolderOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitFolder} disabled={!folderName.trim()}>Add folder</button>
          </>
        }
      >
        <Field label="Folder name">
          <input
            className="input"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitFolder()}
            placeholder="e.g. Hydration"
            autoFocus
          />
        </Field>
      </Modal>

      {/* Rename folder modal */}
      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename folder"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRenameOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitRename} disabled={!folderName.trim()}>Save</button>
          </>
        }
      >
        <Field label="Folder name">
          <input
            className="input"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
            autoFocus
          />
        </Field>
      </Modal>

      {/* Delete folder modal */}
      <Modal
        open={deleteFolderOpen}
        onClose={() => setDeleteFolderOpen(false)}
        title="Delete folder"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteFolderOpen(false)}>Cancel</button>
            <button className="btn-primary bg-rose-600 hover:bg-rose-700" onClick={confirmDeleteFolder}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          Delete <span className="font-semibold text-ink-900">{activeFolder?.name}</span> and its{" "}
          {masterHabits.filter((h) => h.folderId === activeFolder?.id).length} habit(s)? Any client
          assignments to those habits are removed too. This cannot be undone.
        </p>
      </Modal>

      {/* Create / edit habit modal */}
      <Modal
        open={habitModal}
        onClose={() => setHabitModal(false)}
        title={editingId ? "Edit habit" : "New habit"}
        footer={
          <>
            {editingId && (
              <button
                className="btn-secondary mr-auto text-rose-400 hover:bg-rose-500/15"
                onClick={() => { removeMasterHabits([editingId]); setHabitModal(false); }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
            <button className="btn-secondary" onClick={() => setHabitModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitHabit} disabled={!form.name.trim()}>
              {editingId ? "Save" : "Create habit"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
              <HabitIcon icon={form.icon} className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <Field label="Habit name">
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. Drink 8 cups of water"
                  autoFocus
                />
              </Field>
            </div>
          </div>

          <Field label="Description">
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              placeholder="What this habit focuses on and why it matters for the client."
            />
          </Field>

          <div>
            <span className="label">Icon</span>
            <div className="mt-1 grid grid-cols-8 gap-1.5">
              {habitIconKeys.map((key) => {
                const Icon = habitIconFor(key);
                const active = form.icon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, icon: key }))}
                    aria-label={`Use ${key} icon`}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-lg border transition",
                      active
                        ? "border-brand-500 bg-brand-500/15 text-brand-400"
                        : "border-ink-100 text-ink-500 hover:border-ink-300 hover:bg-ink-50",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
