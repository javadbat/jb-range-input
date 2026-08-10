import type { JBRangeInputWebComponent, RangeInputMode } from "jb-range-input";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "jb-range-input": JBRangeInputType;
    }
    interface JBRangeInputType extends React.DetailedHTMLProps<React.HTMLAttributes<JBRangeInputWebComponent>, JBRangeInputWebComponent> {
      min?: number,
      max?: number,
      step?: number,
      pointStep?: number,
      mode?: RangeInputMode,
    }
  }
}
