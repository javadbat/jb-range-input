import type { Meta, StoryObj } from "@storybook/react-vite";
import { JBRangeInput } from "jb-range-input/react";

const meta = {
  title: "Components/form elements/JBRangeInput",
  component: JBRangeInput,
  decorators: [
    Story => (
      <div style={{marginBlock:`4rem`}}>
        <Story />
      </div>
    ),
  ],
  args: {
    min: 0,
    max: 10,
    step: 1,
    pointStep: 1,
  },
  argTypes: {
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    pointStep: { control: "number" },
  },
} satisfies Meta<typeof JBRangeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const DecimalStep: Story = {
  args: {
    max: 3,
    step: 0.1,
    pointStep: 1,
    value: 1.2,
  },
};
export const CustomStep: Story = {
  args: {
    max: 50,
    step: 5,
    pointStep: 5,
    value: 10,
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
    step:0.1
  },
};
