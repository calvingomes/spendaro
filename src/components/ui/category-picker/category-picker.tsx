import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import styles from "./category-picker.module.css";

interface CategoryPickerProps {
  value: string;
  onChange: (category: string) => void;
  categories: string[];
  onAddCategory?: (newCategory: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function CategoryPicker({
  value,
  onChange,
  categories,
  onAddCategory,
  onFocus
}: CategoryPickerProps) {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
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

  return (
    <div className={styles.field}>
      <label className={styles.label}>Category</label>
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
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleNewCategorySubmit();
                }
                if (e.key === "Escape") {
                  setShowAddCategory(false);
                }
              }}
              onBlur={() => {
                if (newCategory.trim()) {
                  handleNewCategorySubmit();
                } else {
                  setShowAddCategory(false);
                }
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

        {categories.map((cat) => {
          const isActive = value.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              type="button"
              className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
              onClick={() => onChange(cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
