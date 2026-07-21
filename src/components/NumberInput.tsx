import {
  useEffect,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react'

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  value: number | undefined
  onChange: (value: number | undefined) => void
}

function toText(v: number | undefined): string {
  return v === undefined || Number.isNaN(v) ? '' : String(v)
}

/**
 * A numeric input that keeps its own text state so it can be genuinely empty
 * (instead of snapping to 0) and so in-progress values like "3." or "3.50"
 * survive keystrokes. Emits a parsed number, or undefined when blank/invalid.
 */
export function NumberInput({ value, onChange, ...rest }: Props) {
  const [text, setText] = useState(() => toText(value))

  // Resync only when the parent value diverges from what our text represents —
  // e.g. a form reset. During normal typing the parsed value matches, so we
  // leave the user's text (and any trailing "." or "0") untouched.
  useEffect(() => {
    const parsed = text.trim() === '' ? undefined : Number(text)
    if (value !== parsed) setText(toText(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setText(raw)
    const trimmed = raw.trim()
    if (trimmed === '') {
      onChange(undefined)
      return
    }
    const parsed = Number(trimmed)
    onChange(Number.isNaN(parsed) ? undefined : parsed)
  }

  return (
    <input type="text" inputMode="decimal" value={text} onChange={handleChange} {...rest} />
  )
}
