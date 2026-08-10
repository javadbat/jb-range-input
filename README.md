# jb-range-input

A discrete single-value or range input web component with a React wrapper.

```html
<script type="module" src="jb-range-input"></script>
<jb-range-input min="0" max="10" step="0.1" point-step="1" value="1.2"></jb-range-input>
```

`step` controls the values a user can select. `point-step` controls the interval
between the visible tick marks and does not affect selection. Both default to `1`.

For example, `step="0.1" point-step="1"` allows `0.1`, `0.2`, `0.3`, and so on,
while showing tick marks at `0`, `1`, `2`, and so on.
