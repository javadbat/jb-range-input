# jb-range-input

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/jb-range-input)
[![GitHub license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://raw.githubusercontent.com/javadbat/jb-range-input/main/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/jb-range-input)](https://www.npmjs.com/package/jb-range-input)
![GitHub Created At](https://img.shields.io/github/created-at/javadbat/jb-range-input)

`jb-range-input` is a form-associated, discrete range input web component. It can select one numeric value or a start/end pair; the [interactive overview](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--normal) shows the default behavior.

- Supports single-value and two-handle range modes.
- Supports integer and decimal steps.
- Configures selectable steps independently from visible tick marks.
- Supports pointer and keyboard interaction.
- Snaps values to the configured step and constrains them to `min` and `max`.
- Supports native HTML form submission and reset through `ElementInternals`.
- Supports custom validation through `jb-validation`.
- Supports TypeScript, ESM, and a React wrapper.
- Supports custom styling with CSS variables, CSS parts, and custom states.

## When to use

Use `jb-range-input` when users should choose a value or interval from a known numeric scale, such as volume, price, score, duration, or filter boundaries; the [range example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--range) shows interval selection.

Use a number input when users need to enter an exact value directly or the available range is too large to navigate comfortably with a slider.

## Demo

- [Storybook](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--normal)

## Using with React

<a href="https://github.com/javadbat/jb-range-input/tree/main/react" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/React.js-jb--range--input%2Freact-000.svg?logo=react&logoColor=%2361DAFB" height="30" /></a>

See the [React documentation](./react/README.md) and its [interactive story](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput-react-readme--docs).

## Installation

```sh
npm i jb-range-input
```

```js
import "jb-range-input";
```

```html
<jb-range-input label="Range value" min="0" max="10" value="4"></jb-range-input>
```

The [normal example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--normal) uses the same basic setup.

### CDN

```html
<script src="https://unpkg.com/jb-range-input/web-component/dist/jb-range-input.umd.js"></script>
```

## API reference

The [API overview](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--normal) demonstrates the main attributes and properties together.

### Attributes

The [attribute controls](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--normal) show these options in Storybook.

| name | type | default | description |
| --- | --- | --- | --- |
| `label` | `string` | `""` | Visible label text and accessible aria label. |
| `value` | `number \| "start,end"` | single/range mode default | Selected value. In range mode, use a comma-separated pair such as `"2,8"`. |
| `mode` | `"single" \| "range"` | `"single"` | Selects one value or a start/end pair. |
| `start-point` | `number` | single-mode default | Start of the active line in single mode. Defaults to `0` when zero is within the range, otherwise `min`. Ignored in range mode. |
| `min` | `number` | `0` | Minimum selectable value. |
| `max` | `number` | `10` | Maximum selectable value. |
| `step` | `number` | `1` | Increment used to snap selected values and handle keyboard navigation. |
| `tick-step` | `number` | `1` | Interval between visible tick marks. It does not constrain selection. |
| `minor-tick-step` | `number` | none | Interval between optional minor ticks. Minor ticks never receive labels. |
| `show-tick-labels` | `boolean` | `false` | Displays labels below major ticks. |
| `show-persian-number` | `boolean` | locale based | Displays Persian digits in tick labels, slider accessibility text, and the value balloon while keeping `.value` numeric. |
| `disable-balloon-rotation` | `boolean` | `false` | Disables velocity-based balloon rotation while dragging. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | Visual size variant. |
| `name` | `string` | `""` | Field name used during form submission. |
| `disabled` | `boolean` | `false` | Disables pointer and keyboard interaction. |
| `required` | `boolean` | `false` | Requires a value to be provided initially or selected by the user. |
| `message` | `string` | `""` | Helper message displayed below the range. |
| `error` | `string` | `""` | External validation error message. |

### Properties

The [controlled range example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--controlled-range) demonstrates property updates.

| name | type | readonly | description |
| --- | --- | --- | --- |
| `label` | `string` | no | Visible label text and accessible aria label. |
| `value` | `number \| [number, number]` | no | Current normalized value. Returns a tuple in range mode. |
| `initialValue` | `number \| [number, number]` | no | Initial and form-reset value. It initializes `value` until the live value becomes dirty. |
| `mode` | `"single" \| "range"` | no | Current selection mode. |
| `startPoint` | `number` | no | Start of the active line in single mode. Defaults like the single-mode value and is ignored in range mode. |
| `min` | `number` | no | Minimum selectable value. |
| `max` | `number` | no | Maximum selectable value. |
| `step` | `number` | no | Selectable increment. Non-positive or invalid values normalize to `1`. |
| `tickStep` | `number` | no | Visible tick interval. Non-positive or invalid values normalize to `1`. |
| `minorTickStep` | `number \| null` | no | Minor-tick interval, or `null` to hide minor ticks. |
| `showTickLabels` | `boolean` | no | Displays labels below major ticks. |
| `showPersianNumber` | `boolean` | no | Overrides locale-based Persian digit display without changing numeric values. |
| `disableBalloonRotation` | `boolean` | no | Disables velocity-based balloon rotation while dragging. |
| `tickLabelFormatter` | `(value: number) => string` | no | Formats major-tick labels. Functions are configured through JavaScript, not attributes. |
| `name` | `string` | no | Associated form field name. |
| `disabled` | `boolean` | no | Enables or disables interaction. |
| `required` | `boolean` | no | Requires a provided or user-selected value. |
| `form` | `HTMLFormElement \| null` | yes | Associated native form. |
| `isDirty` | `boolean` | yes | Whether the current value differs from `initialValue`. |
| `validation` | `ValidationHelper<RangeInputValue>` | yes | Shared helper used to configure and run custom validations. |
| `isAutoValidationDisabled` | `boolean` | no | Disables automatic validation during user interaction. |
| `validationMessage` | `string` | yes | Current message from `ElementInternals`. |

### Methods

The [validation example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--with-error) exercises the imperative validity methods.

| name | returns | description |
| --- | --- | --- |
| `checkValidity()` | `boolean` | Runs validation without showing the error and dispatches `invalid` when invalid. |
| `reportValidity()` | `boolean` | Runs validation, shows the invalid state, and dispatches `invalid` when invalid. |
| `clearValidationError()` | `void` | Clears the visible invalid state. |

### Events

The [form example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--in-form) shows the component participating in browser events and submission.

| event | description |
| --- | --- |
| `input` | Dispatched after a user-selected value is applied. The current value is available on `event.target.value`. |
| `change` | Dispatched after a completed pointer or keyboard interaction. |
| `invalid` | Dispatched by `checkValidity()` or `reportValidity()` when validation fails. |

## Single-value mode

Single mode renders one handle and returns a number; see the [single-value example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--normal) and the [start-point example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--start-point):

```html
<jb-range-input min="0" max="100" step="5" value="25"></jb-range-input>
```

```js
const rangeInput = document.querySelector("jb-range-input");

rangeInput.value = 40;
console.log(rangeInput.value); // 40
```

## Range mode

Range mode renders two handles. The first value cannot move above the second, and the second cannot move below the first; the [range story](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--range) shows the interaction.

When range mode receives one number, that number becomes the upper value and `min` becomes the lower value. When changing from range mode to single mode, the range's upper value is preserved.

```html
<jb-range-input mode="range" min="0" max="100" value="20,80"></jb-range-input>
```

Use a tuple when assigning the JavaScript property:

```js
const rangeInput = document.querySelector("jb-range-input");

rangeInput.mode = "range";
rangeInput.value = [20, 80];
console.log(rangeInput.value); // [20, 80]
```

## Step and tick marks

`step` controls the values a user can select. `tick-step` controls the visible tick interval and does not affect selection; compare the [decimal-step example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--decimal-step).

```html
<jb-range-input
  min="0"
  max="10"
  step="0.1"
  tick-step="1"
  value="1.2"
></jb-range-input>
```

This configuration allows `0.1`, `0.2`, `0.3`, and so on, while drawing ticks at `0`, `1`, `2`, and so on.

Major ticks can display labels, and optional minor ticks can add visual subdivisions without labels:

```html
<jb-range-input
  min="0"
  max="100"
  step="5"
  tick-step="25"
  minor-tick-step="5"
  show-tick-labels
></jb-range-input>
```

Customize label text with a JavaScript formatter:

```js
const rangeInput = document.querySelector("jb-range-input");
rangeInput.tickLabelFormatter = value => `${value}%`;
```

Values assigned between steps are snapped to the nearest valid step and clamped to the configured bounds.

## Size variants

Use `xs`, `sm`, `md`, `lg`, or `xl`. Omitting `size` uses the `md` styles; the [size variants story](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--size-variants) compares them.
The balloon scales by 15 percentage points between adjacent sizes: 70%, 85%, 100%, 115%, and 130% respectively.

```html
<jb-range-input size="sm" value="4"></jb-range-input>
```

The balloon tilts subtly based on horizontal drag speed and returns to center when movement stops. Disable this motion when a quieter or less resource-intensive interaction is preferred:

```html
<jb-range-input disable-balloon-rotation></jb-range-input>
```

## Forms

`jb-range-input` participates in native forms. Single values are submitted as numeric strings. Range values are submitted as comma-separated strings such as `"20,80"`; the [form example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--in-form) shows submission and reset.

```html
<form id="filters">
  <jb-range-input
    name="price"
    mode="range"
    min="0"
    max="100"
    value="20,80"
  ></jb-range-input>
  <button type="reset">Reset</button>
  <button type="submit">Apply</button>
</form>
```

Set `initialValue` to control the value restored by form reset:

```js
const rangeInput = document.querySelector("jb-range-input");
rangeInput.initialValue = [20, 80];
```

## Validation

The component uses [`jb-validation`](https://github.com/javadbat/jb-validation). Set the `error` attribute for an external error or configure `validation.list` for custom rules; see the [validation example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--with-error).

```js
const rangeInput = document.querySelector("jb-range-input");

rangeInput.validation.list = [
  {
    validator: value => !Array.isArray(value) || value[1] - value[0] >= 10,
    message: "The selected range must span at least 10 units",
  },
];

rangeInput.reportValidity();
```

Custom validators receive a `number` in single mode or `[number, number]` in range mode.

## Keyboard interaction

Focus a handle and use the keyboard as shown in the [disabled and interaction stories](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--disabled):

- `ArrowLeft` or `ArrowDown` to subtract one `step`.
- `ArrowRight` or `ArrowUp` to add one `step`.

Keyboard changes remain constrained to `min`, `max`, and the other handle in range mode.

## CSS parts and variables

The [styling gallery](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput-style--gallery) demonstrates the available theme recipes and customization points.

### Parts

The [styling gallery](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput-style--gallery) shows the exposed parts in context.

| part | description |
| --- | --- |
| `root` | Root component wrapper. |
| `label` | Visible label element. |
| `range` | Main SVG range surface. |
| `range-line` | Inactive track line. |
| `range-active-line` | Active track from the minimum or between range handles. |
| `range-ticks` | Group containing all tick marks. |
| `range-tick` | Each generated tick mark. |
| `range-major-tick` | Each generated major tick. |
| `range-minor-tick` | Each generated minor tick. |
| `tick-labels` | Container for major-tick labels. |
| `tick-label` | Each generated major-tick label. |
| `range-handles` | Group containing the slider handles. |
| `range-handle` | Each generated slider handle. |
| `range-joined-shapes` | Filtered group containing the handles and balloon. |
| `range-balloon` | Balloon displayed while dragging. |
| `range-balloon-content` | Animated content group inside the balloon. |
| `range-balloon-shape` | Balloon background path. |
| `range-balloon-label` | Group containing the balloon value label. |
| `range-balloon-value` | Text showing the current drag value. |
| `message` | Helper or validation message below the range. |

### Custom states

The [disabled and validation stories](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--disabled) show the component states.

| state | description |
| --- | --- |
| `disabled` | Applied when interaction is disabled. |
| `required` | Applied when `required` is true. |
| `invalid` | Applied while a validation error is visible. |

### CSS variables

The [theme gallery](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput-style--gallery) demonstrates these variables across several visual styles.

| variable | default | description |
| --- | --- | --- |
| `--jb-range-input-width` | `100%` | Component width. |
| `--jb-range-input-height` | `4rem` | SVG height. |
| `--jb-range-input-label-margin` | `0.125rem 0` | Label margin. The component applies range-edge padding separately to align the label with the track. |
| `--jb-range-input-label-font-size` | `0.8rem` | Label font size. |
| `--jb-range-input-label-color` | `--jb-content-primary` | Label color. |
| `--jb-range-input-label-font-weight` | `300` | Label font weight. |
| `--jb-range-input-color` | `--jb-primary` | Base color used by active elements. |
| `--jb-range-input-line-color` | `--jb-content-secondary` | Inactive line color. |
| `--jb-range-input-line-width` | `1` | Inactive line stroke width. |
| `--jb-range-input-line-dash-array` | `2 8` | Inactive line dash pattern. |
| `--jb-range-input-active-line-color` | base color | Active line color. |
| `--jb-range-input-active-line-width` | line width + `2` | Active line stroke width. |
| `--jb-range-input-active-line-dash-array` | `1 0` | Active line dash pattern. |
| `--jb-range-input-tick-color` | base color | Tick color. |
| `--jb-range-input-tick-width` | `2px` | Tick stroke width. |
| `--jb-range-input-tick-height` | `0.75rem` | Tick height. |
| `--jb-range-input-minor-tick-color` | major tick color | Minor-tick color. |
| `--jb-range-input-minor-tick-width` | `1px` | Minor-tick stroke width. |
| `--jb-range-input-minor-tick-height` | half major tick height | Minor-tick height. |
| `--jb-range-input-tick-label-color` | `--jb-content-secondary` | Major-tick label color. |
| `--jb-range-input-tick-label-font-size` | `0.75rem` | Major-tick label font size. |
| `--jb-range-input-tick-label-line-height` | `1.2` | Major-tick label line height. |
| `--jb-range-input-tick-label-gap` | `0.25rem` | Gap between major ticks and their labels. |
| `--jb-range-input-handle-color` | base color | Handle color. |
| `--jb-range-input-handle-size` | `0.5rem` | Handle radius. |
| `--jb-range-input-balloon-color` | base color | Drag balloon color. |
| `--jb-range-input-balloon-text-color` | `--jb-content-inverse` | Drag balloon text color. |
| `--jb-range-input-balloon-font-size` | `0.75rem` | Drag balloon text size. |
| `--jb-range-input-balloon-scale` | `1` | Base balloon scale. |
| `--jb-range-input-balloon-hover-offset` | `0.375rem` | Balloon offset above the handle while hovered. |
| `--jb-range-input-message-font-size` | `0.7rem` | Helper/error message font size. |
| `--jb-range-input-message-margin` | `0` | Message box margin. |
| `--jb-range-input-message-box-display` | `block` | Message box display mode. |
| `--jb-range-input-message-color` | `--jb-content-secondary` | Helper message color. |
| `--jb-range-input-message-color-error` | `--jb-red` | Validation error color. |
| `--jb-range-input-color-disabled` | `--jb-neutral-9` | Base color while disabled. |
| `--jb-range-input-line-color-disabled` | `--jb-neutral-9` | Inactive line color while disabled. |
| `--jb-range-input-active-line-color-disabled` | disabled base color | Active line color while disabled. |
| `--jb-range-input-tick-color-disabled` | disabled base color | Tick color while disabled. |
| `--jb-range-input-minor-tick-color-disabled` | disabled tick color | Minor-tick color while disabled. |
| `--jb-range-input-tick-label-color-disabled` | `--jb-content-secondary` | Tick-label color while disabled. |
| `--jb-range-input-handle-color-disabled` | disabled base color | Handle color while disabled. |
| `--jb-range-input-balloon-color-disabled` | disabled base color | Balloon color while disabled. |
| `--jb-range-input-balloon-text-color-disabled` | `--jb-content-secondary` | Balloon text color while disabled. |

Each size variant also exposes `-xs`, `-sm`, `-lg`, and `-xl` overrides for `height`, `label-font-size`, `tick-height`, `minor-tick-height`, `handle-size`, `tick-label-font-size`, `message-font-size`, `balloon-scale`, and `balloon-hover-offset`. For example, use `--jb-range-input-label-font-size-sm` to customize only the `sm` label.

```css
jb-range-input {
  --jb-range-input-color: #2563eb;
  --jb-range-input-line-color: #cbd5e1;
  --jb-range-input-handle-size: 0.625rem;
}

jb-range-input:state(invalid)::part(range-handle) {
  fill: #dc2626;
}
```

## Accessibility notes

- Each handle has `role="slider"`, keyboard focus, and `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext`, as shown in the [normal accessibility example](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--normal).
- The `label` attribute renders a visible label, provides the component's accessible label, and focuses the first handle when clicked.
- Disabled handles are removed from the tab order and pointer/keyboard interaction is blocked.
- Required, disabled, and invalid states are exposed through ARIA and custom states.

## Related docs

- See [`jb-range-input/react`](./react/README.md) for React usage and the [React story](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput-react-readme--docs).
- See [`jb-validation`](https://github.com/javadbat/jb-validation) for custom validation rules.
- See [All JB Design System components](https://javadbat.github.io/design-system/) for more components.
- Use the [Contribution Guide](https://github.com/javadbat/design-system/blob/main/docs/contribution-guide.md) when contributing.

## AI agent notes

- Import `jb-range-input` once before rendering `<jb-range-input>`; the [overview story](https://javadbat.github.io/design-system/?path=/story/components-form-elements-jbrangeinput--normal) is a compact reference.
- Use a number in single mode and a `[number, number]` tuple in range mode.
- The HTML `value` attribute uses a comma-separated string in range mode.
- `step` controls selectable values; `tick-step` controls tick rendering only.
- Read the current typed value from `event.target.value`.
- Form submission serializes a range tuple as a comma-separated string.
- Use `validation.list` for custom validation rules.
