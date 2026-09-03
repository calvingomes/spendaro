import styles from "./amount-input.module.css";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function AmountInput({ value, onChange, label, onFocus, disabled }: AmountInputProps) {
  return (
    <div className={styles.amountSection}>
      {label && <span className={styles.amountLabel}>{label}</span>}
      <div className={styles.amountContainer}>
        <span className={styles.currencySymbol}>₹</span>
        <div className={styles.inputWrapper}>
          <span className={styles.mirrorSpan}>
            {value || "0.00"}
          </span>
          <input
            type="text"
            inputMode="decimal"
            className={styles.largeAmountInput}
            value={value}
            onFocus={onFocus}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                onChange(val);
              }
            }}
            placeholder="0.00"
            disabled={disabled}
            required
          />
        </div>
      </div>
    </div>
  );
}
