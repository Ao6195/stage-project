import React, { useState } from 'react';
import { FiCheck, FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { useLanguage } from '../../lib/useLanguage';

export default function CategoryManager({
  categories,
  creatingCategory,
  updatingCategoryId,
  deletingCategoryId,
  onCreate,
  onRename,
  onDelete,
}) {
  const { t } = useLanguage();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditingName('');
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    const created = await onCreate(newName);
    if (created) setNewName('');
  };

  const submitRename = async (event, category) => {
    event.preventDefault();
    const renamed = await onRename(category, editingName);
    if (renamed) cancelEdit();
  };

  if (!categories.some((category) => category.canManage)) return null;

  return (
    <div className="category-manager-compact">
      <button
        type="button"
        className="category-manage-trigger ghost-btn"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={t('manage')}
        aria-expanded={isOpen}
        title={t('manage')}
      >
        <FiEdit2 />
      </button>

      {isOpen && (
        <div className="category-dropdown">
          <form className="category-dropdown-create" onSubmit={submitCreate}>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder={t('new_category_placeholder')}
              maxLength={40}
              required
            />
            <button
              type="submit"
              className="category-icon-btn main-btn"
              aria-label={creatingCategory ? t('creating') : t('add_category')}
              title={creatingCategory ? t('creating') : t('add_category')}
              disabled={creatingCategory}
            >
              <FiPlus />
            </button>
          </form>

          <div className="category-dropdown-list">
            {categories.map((category) => (
              <div key={category.id} className="category-dropdown-row">
                {editingId === category.id ? (
                  <form className="category-edit-form" onSubmit={(event) => submitRename(event, category)}>
                    <input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      maxLength={40}
                      required
                    />
                    <button
                      type="submit"
                      className="category-icon-btn main-btn"
                      aria-label={t('save')}
                      title={t('save')}
                      disabled={updatingCategoryId === category.id}
                    >
                      <FiCheck />
                    </button>
                    <button
                      type="button"
                      className="category-icon-btn ghost-btn"
                      aria-label={t('cancel')}
                      title={t('cancel')}
                      onClick={cancelEdit}
                      disabled={updatingCategoryId === category.id}
                    >
                      <FiX />
                    </button>
                  </form>
                ) : (
                  <>
                    <strong>{category.name}</strong>
                    <div className="category-row-actions">
                      <button
                        type="button"
                        className="category-icon-btn ghost-btn"
                        aria-label={t('rename')}
                        title={t('rename')}
                        onClick={() => startEdit(category)}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="category-icon-btn danger-btn"
                        aria-label={t('delete')}
                        title={t('delete')}
                        onClick={() => onDelete(category)}
                        disabled={deletingCategoryId === category.id || categories.length <= 1}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
