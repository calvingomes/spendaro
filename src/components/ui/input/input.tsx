import styles from "./input.module.css";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  onChange: (value: string) => void;
}

export function Input({ label, value, onChange, ...props }: InputProps) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        className={styles.textInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );
}
