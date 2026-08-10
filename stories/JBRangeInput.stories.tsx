import type { Meta, StoryObj } from "@storybook/react-vite";
import { JBRangeInput } from "jb-range-input/react";

const meta = {
  title: "Components/form elements/JBRangeInput",
  component: JBRangeInput,
  args: {
    children: "Hello world",
  },
} satisfies Meta<typeof JBRangeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HelloWorld: Story = {};
