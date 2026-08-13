import type { JBRangeInputWebComponent, RangeInputMode, RangeInputValue, SizeVariants } from "jb-range-input";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "jb-range-input": JBRangeInputType;
    }
    interface JBRangeInputType extends React.DetailedHTMLProps<React.HTMLAttributes<JBRangeInputWebComponent>, JBRangeInputWebComponent> {
      min?: number;
      max?: number;
      step?: number;
      tickStep?: number;
      minorTickStep?: number | null;
      showTickLabels?: boolean;
      disableBalloonRotation?: boolean;
      tickLabelFormatter?: (value: number) => string;
      size?: SizeVariants;
      mode?: RangeInputMode;
      value?: RangeInputValue;
      startPoint?: number;
      initialValue?: RangeInputValue;
      label?: string;
      name?: string;
      disabled?: boolean;
      required?: boolean;
      message?: string;
      error?: string;
    }
  }
}
