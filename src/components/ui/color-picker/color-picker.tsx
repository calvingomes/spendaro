import clsx from "clsx";
import styles from "./color-picker.module.css";

const DEFAULT_COLORS = ["#f5a623", "#00d27a", "#0070f3", "#ee0000", "#7928ca", "#ff0080", "#50e3c2"];

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
  colors?: string[];
}

export function ColorPicker({ selectedColor, onChange, colors = DEFAULT_COLORS }: ColorPickerProps) {
  return (
    <div className={styles.colorPicker}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className={clsx(styles.colorCircle, selectedColor === color && styles.activeColorCircle)}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}
