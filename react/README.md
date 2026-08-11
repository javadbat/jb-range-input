# jb-range-input React component

React wrapper for [`jb-range-input`](https://github.com/javadbat/jb-range-input). It registers the underlying web component, forwards React props, and supports both a single numeric value and a two-value range.

## Installation

```sh
npm i jb-range-input
```

```tsx
import { JBRangeInput } from "jb-range-input/react";

<JBRangeInput min={0} max={100} step={5} value={25} />;
```

## Props

`JBRangeInput` accepts standard React HTML attributes plus these component props:

| prop | type | default | description |
| --- | --- | --- | --- |
| `label` | `string` | `""` | Visible label text and accessible aria label. |
| `value` | `number \| [number, number]` | `0` | Controlled selected value. Use a tuple when `mode="range"`. |
| `initialValue` | `number \| [number, number]` | `0` | Initial and form-reset value. |
| `mode` | `"single" \| "range"` | `"single"` | Selects one value or a start/end pair. |
| `min` | `number` | `0` | Minimum selectable value. |
| `max` | `number` | `10` | Maximum selectable value. |
| `step` | `number` | `1` | Increment used for selection and keyboard navigation. |
| `tickStep` | `number` | `1` | Interval between visible tick marks; it does not constrain selection. |
| `minorTickStep` | `number \| null` | `null` | Interval between optional unlabeled minor ticks. |
| `showTickLabels` | `boolean` | `false` | Displays labels below major ticks. |
| `disableBalloonRotation` | `boolean` | `false` | Disables velocity-based balloon rotation while dragging. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Visual size variant. |
| `tickLabelFormatter` | `(value: number) => string` | string conversion | Formats major-tick labels. |
| `name` | `string` | `""` | Field name used during form submission. |
| `disabled` | `boolean` | `false` | Disables pointer and keyboard interaction. |
| `required` | `boolean` | `false` | Requires a value to be provided initially or selected by the user. |
| `message` | `string` | `""` | Helper message displayed below the range. |
| `error` | `string` | - | External validation error message. |

## Controlled value

```tsx
import { useState } from "react";
import { JBRangeInput } from "jb-range-input/react";

export function VolumeInput() {
  const [value, setValue] = useState(25);

  return (
    <JBRangeInput
      min={0}
      max={100}
      value={value}
      onChange={event => setValue(event.currentTarget.value as number)}
    />
  );
}
```

For a two-handle range, set `mode="range"` and use a tuple:

```tsx
const [priceRange, setPriceRange] = useState<[number, number]>([20, 80]);

<JBRangeInput
  mode="range"
  min={0}
  max={100}
  step={5}
  value={priceRange}
  onChange={event =>
    setPriceRange(event.currentTarget.value as [number, number])}
/>;
```

If range mode receives one number, the wrapper treats it as the upper value and uses `min` as the lower value. Switching a range back to single mode preserves its upper value.

`onInput` is dispatched when the component applies a user-selected value. `onChange` follows the completed pointer or keyboard interaction.

## Step and tick marks

`step` controls selectable values, while `tickStep` controls only the visible tick spacing:

```tsx
<JBRangeInput min={0} max={10} step={0.1} tickStep={1} />
```

This allows values such as `1.1` and `1.2`, but draws ticks only at whole numbers.

Use the `size` prop to select an `xs`, `sm`, `md`, `lg`, or `xl` visual variant:
The balloon scales to 70%, 85%, 100%, 115%, and 130% across those variants.

```tsx
<JBRangeInput size="sm" value={4} />
```

Set `disableBalloonRotation` when velocity-based balloon motion is not desired:

```tsx
<JBRangeInput disableBalloonRotation />
```

Add labels to major ticks and optional unlabeled minor ticks:

```tsx
<JBRangeInput
  min={0}
  max={100}
  step={5}
  tickStep={25}
  minorTickStep={5}
  showTickLabels
  tickLabelFormatter={value => `${value}%`}
/>
```

## Forms and validation

The component is form-associated. Single values are submitted as a number string; range values are submitted as comma-separated values such as `"20,80"`.

```tsx
<form>
  <JBRangeInput name="price" mode="range" initialValue={[20, 80]} />
  <button type="reset">Reset</button>
  <button type="submit">Submit</button>
</form>
```

Use `error` for an external validation failure, or access the shared validation helper through a ref:

```tsx
import { useRef } from "react";
import type { JBRangeInputWebComponent } from "jb-range-input";

const rangeRef = useRef<JBRangeInputWebComponent>(null);

<JBRangeInput ref={rangeRef} error="Select an allowed range" />;
<button type="button" onClick={() => rangeRef.current?.reportValidity()}>
  Check range
</button>;
```

The ref also exposes `checkValidity()`, `reportValidity()`, `validation`, `validationMessage`, `isDirty`, and `form`.

## Styling

The React wrapper uses the web component's CSS variables and shadow parts. See the shared [`jb-range-input` documentation](../README.md).

## AI agent notes

- Import `JBRangeInput` from `jb-range-input/react`.
- Use a number in single mode and a `[number, number]` tuple in range mode.
- Read the current typed value from `event.currentTarget.value`.
- `step` controls selectable values; `tickStep` controls tick rendering only.
- Form submission serializes a range tuple as a comma-separated string.
