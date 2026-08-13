import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import type { JBRangeInputWebComponent, RangeInputValue } from "jb-range-input";
import { JBRangeInput } from "jb-range-input/react";

const meta = {
  title: "Components/form elements/JBRangeInput",
  component: JBRangeInput,
  decorators: [
    Story => (
      <div style={{ marginBlock: "4rem" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Range value",
    min: 0,
    max: 10,
    step: 1,
    tickStep: 1,
    startPoint: 0,
  },
  argTypes: {
    label: { control: "text" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    tickStep: { control: "number" },
    startPoint: { control: "number" },
    minorTickStep: { control: "number" },
    showTickLabels: { control: "boolean" },
    disableBalloonRotation: { control: "boolean" },
    size: { control: "inline-radio", options: ["xs", "sm", "md", "lg", "xl"] },
    mode: { control: "inline-radio", options: ["single", "range"] },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    message: { control: "text" },
    error: { control: "text" },
  },
} satisfies Meta<typeof JBRangeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  play: async ({ canvasElement }) => {
    const rangeInput = canvasElement.querySelector<JBRangeInputWebComponent>("jb-range-input")!;
    const label = rangeInput.shadowRoot!.querySelector<HTMLLabelElement>("[part='label']")!;
    const range = rangeInput.shadowRoot!.querySelector<SVGSVGElement>("[part='range']")!;
    const firstHandle = rangeInput.shadowRoot!.querySelector<SVGCircleElement>("[part~='range-handle']")!;

    await waitFor(() => expect(label.textContent).toBe("Range value"));
    expect(range.getAttribute("aria-labelledby")).toBe("range-label");
    label.click();
    expect(rangeInput.shadowRoot!.activeElement).toBe(firstHandle);
  },
};

export const StartPoint: Story = {
  name: "Start Point",
  args: {
    min: -10,
    max: 20,
    step: 5,
    startPoint: -5,
    value: 10,
  },
  play: async ({ canvasElement }) => {
    const rangeInput = canvasElement.querySelector<JBRangeInputWebComponent>("jb-range-input")!;
    const line = rangeInput.shadowRoot!.querySelector<SVGLineElement>("[part='range-active-line']")!;
    const track = rangeInput.shadowRoot!.querySelector<SVGLineElement>("[part='range-line']")!;

    await waitFor(() => expect(rangeInput.getAttribute("start-point")).toBe("-5"));
    expect(rangeInput.value).toBe(10);

    const trackStart = Number(track.getAttribute("x1"));
    const trackEnd = Number(track.getAttribute("x2"));
    const expectedStart = trackStart + ((-5 - -10) / (20 - -10)) * (trackEnd - trackStart);
    expect(Number(line.getAttribute("x1"))).toBeCloseTo(expectedStart, 5);
  },
};

export const WithoutBalloonRotation: Story = {
  args: {
    value: 5,
    disableBalloonRotation: true,
  },
};

export const SizeVariants: Story = {
  args: {
    tickStep: 5,
    value: 5,
    showTickLabels: true,
  },
  render: args => (
    <div style={{ display: "grid", gap: "2rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map(size => (
        <div key={size}>
          <span>{size}</span>
          <JBRangeInput {...args} size={size} />
        </div>
      ))}
    </div>
  ),
};

export const DecimalStep: Story = {
  args: {
    max: 3,
    step: 0.1,
    tickStep: 1,
    value: 1.2,
  },
};
export const CustomStep: Story = {
  args: {
    max: 50,
    step: 5,
    tickStep: 5,
    value: 10,
  },
};

export const WithTickLabels: Story = {
  args: {
    max: 100,
    step: 5,
    tickStep: 25,
    showTickLabels: true,
    value: 50,
  },
};

export const MajorAndMinorTicks: Story = {
  args: {
    max: 100,
    step: 5,
    tickStep: 25,
    minorTickStep: 5,
    showTickLabels: true,
    tickLabelFormatter: value => `${value}%`,
    value: 50,
  },
};

export const WithoutTickLabels: Story = {
  args: {
    max: 100,
    tickStep: 25,
    value: 50,
  },
};

export const Range: Story = {
  args: {
    mode: "range",
    value: [2, 8],
  },
};
export const RangeDecimalStep: Story = {
  args: {
    mode: "range",
    value: [2, 8],
    step: 0.1,
  },
};

export const Disabled: Story = {
  args: {
    value: 4,
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const rangeInput = canvasElement.querySelector<JBRangeInputWebComponent>("jb-range-input")!;
    const handle = rangeInput.shadowRoot!.querySelector<SVGCircleElement>(".range-handle")!;

    await waitFor(() => expect(rangeInput.disabled).toBe(true));
    expect(rangeInput.hasAttribute("disabled")).toBe(true);
    expect(handle.getAttribute("tabindex")).toBe("-1");

    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(rangeInput.value).toBe(4);
  },
};

export const WithMessage: Story = {
  args: {
    value: 4,
    message: "Choose a value between 0 and 10",
  },
};

export const NegativeMin: Story = {
  args: {
    min: -10,
    max: 10,
    value: -4,
  },
};

export const NegativeRange: Story = {
  args: {
    mode: "range",
    min: -100,
    max: 100,
    step: 10,
    tickStep: 20,
    value: [-40, 60],
  },
};

export const Required: Story = {
  args: {
    name: "score",
    required: true,
    message: "Select a score",
  },
  render: args => (
    <form onSubmit={event => event.preventDefault()}>
      <p id="required-range-label">Required score</p>
      <JBRangeInput {...args} aria-labelledby="required-range-label" />
      <button type="submit">Submit</button>
    </form>
  ),
};

function ErrorExample(props: ComponentProps<typeof JBRangeInput>) {
  const rangeRef = useRef<JBRangeInputWebComponent>(null);

  useEffect(() => {
    rangeRef.current?.reportValidity();
  }, []);

  return <JBRangeInput {...props} ref={rangeRef} />;
}

export const WithError: Story = {
  args: {
    value: 4,
    message: "Choose a value between 0 and 10",
    error: "This value is not available",
  },
  render: args => <ErrorExample {...args} />,
};

function ControlledExample() {
  const [value, setValue] = useState<RangeInputValue>([2, 8]);

  return (
    <div>
      <JBRangeInput mode="range" min={0} max={10} value={value} onChange={event => setValue(event.currentTarget.value)} />
      <output>Selected range: {Array.isArray(value) ? value.join(" - ") : value}</output>
    </div>
  );
}

export const ControlledRange: Story = {
  render: () => <ControlledExample />,
};

export const InForm: Story = {
  render: () => (
    <form
      onSubmit={event => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        alert(`Submitted price: ${formData.get("price")}`);
      }}
    >
      <p id="price-range-label">Price range</p>
      <JBRangeInput aria-labelledby="price-range-label" name="price" mode="range" min={0} max={100} step={5} initialValue={[20, 80]} />
      <div>
        <button type="reset">Reset</button>
        <button type="submit">Submit</button>
      </div>
    </form>
  ),
};

export const AttributeAndFormSynchronization: Story = {
  render: () => <div dangerouslySetInnerHTML={{ __html: '<form><jb-range-input name="range" value="2,8" mode="range"></jb-range-input></form>' }} />,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector("form")!;
    const rangeInput = form.querySelector<JBRangeInputWebComponent>("jb-range-input")!;

    await waitFor(() => expect(rangeInput.value).toEqual([2, 8]));

    rangeInput.setAttribute("max", "5");
    expect(rangeInput.value).toEqual([2, 5]);
    expect(rangeInput.getAttribute("value")).toBe("2,5");
    expect(new FormData(form).get("range")).toBe("2,5");

    rangeInput.setAttribute("mode", "single");
    expect(rangeInput.value).toBe(5);
    expect(new FormData(form).get("range")).toBe("5");
  },
};
