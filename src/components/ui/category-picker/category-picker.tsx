import { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import styles from "./category-picker.module.css";

interface CategoryPickerProps {
  value: string;
  onChange: (category: string) => void;
  categories: string[];
  onAddCategory?: (newCategory: string) => void;
  onRemoveCategory?: (category: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function CategoryPicker({
  value,
  onChange,
  categories,
  onAddCategory,
  onRemoveCategory,
  onFocus
}: CategoryPickerProps) {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddCategory && newCategoryInputRef.current) {
      newCategoryInputRef.current.focus();
    }
  }, [showAddCategory]);

  const handleNewCategorySubmit = () => {
    const trimmed = newCategory.trim();
    if (trimmed) {
      if (onAddCategory) {
        onAddCategory(trimmed);
      } else {
        onChange(trimmed);
      }
      setNewCategory("");
    }
    setShowAddCategory(false);
  };

  const row1 = categories.filter((_, i) => i % 2 === 0);
  const row2 = categories.filter((_, i) => i % 2 === 1);

  const renderChip = (cat: string) => {
    const isActive = value.toLowerCase() === cat.toLowerCase();
    const isRemoving = pendingRemove === cat;

    if (isRemoving) {
      return (
        <button
          key={cat}
          type="button"
          className={`${styles.chip} ${styles.chipActive} ${styles.chipRemoving}`}
          onClick={() => {
            setPendingRemove(null);
            if (value.toLowerCase() === cat.toLowerCase()) onChange("");
            onRemoveCategory?.(cat);
          }}
        >
          {cat}
          <span className={styles.removeOverlay}>
            <X size={12} strokeWidth={3} />
          </span>
        </button>
      );
    }

    return (
      <button
        key={cat}
        type="button"
        className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
        onClick={() => {
          if (isActive && onRemoveCategory) {
            setPendingRemove(cat);
          } else {
            setPendingRemove(null);
            onChange(cat);
          }
        }}
      >
        {cat}
      </button>
    );
  };

  return (
    <div className={styles.field}>
      <label className={styles.label}>Category</label>
      <div className={styles.scrollWrapper}>
        <div className={styles.chipsGrid}>
          <div className={styles.chipsRow}>
            {showAddCategory ? (
              <div className={styles.inlineCategoryForm}>
                <input
                  ref={newCategoryInputRef}
                  type="text"
                  placeholder="New..."
                  value={newCategory}
                  onFocus={onFocus}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={styles.inlineCategoryInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleNewCategorySubmit(); }
                    if (e.key === "Escape") { setShowAddCategory(false); }
                  }}
                  onBlur={() => {
                    if (newCategory.trim()) handleNewCategorySubmit();
                    else setShowAddCategory(false);
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                className={styles.addCategoryChip}
                onClick={() => setShowAddCategory(true)}
                aria-label="Add custom category"
              >
                <Plus size={16} />
              </button>
            )}
            {row1.map(renderChip)}
          </div>
          {row2.length > 0 && <div className={styles.chipsRow}>{row2.map(renderChip)}</div>}
        </div>
      </div>
    </div>
  );
}
