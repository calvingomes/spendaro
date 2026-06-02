"use client";

import styles from "./rectangle-toggle.module.css";

interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleControlProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  colorMap?: Partial<Record<T, "green" | "red">>;
}

export function RectangleToggle<T extends string>({
  options,
  value,
  onChange,
  colorMap,
}: ToggleControlProps<T>) {
  return (
    <div className={styles.toggleControl}>
      {options.map((option) => {
        const isActive = value === option.value;
        const color = colorMap?.[option.value];
        const activeColorClass = isActive && color === "green"
          ? styles.activeGreen
          : isActive && color === "red"
            ? styles.activeRed
            : "";

        return (
          <button
            key={option.value}
            type="button"
            className={[
              styles.toggleButton,
              isActive ? styles.activeToggle : "",
              activeColorClass,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
