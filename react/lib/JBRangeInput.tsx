"use client";

import React, { type PropsWithChildren, useEffect, useImperativeHandle } from "react";
import "jb-range-input";
import type { JBRangeInputWebComponent, RangeInputMode, RangeInputValue } from "jb-range-input";
import "./module-declaration.js";

export type JBRangeInputProps = PropsWithChildren<React.HTMLAttributes<JBRangeInputWebComponent> & {
  min?: number;
  max?: number;
  step?: number;
  pointStep?: number;
  mode?: RangeInputMode;
  value?: RangeInputValue;
}>;

export const JBRangeInput = React.forwardRef<JBRangeInputWebComponent, JBRangeInputProps>((props, ref) => {
  const element = React.useRef<JBRangeInputWebComponent>(null);
  useImperativeHandle(ref, () => element.current!, []);

  const { value, children, ...otherProps } = props;
  useEffect(() => {
    if (value !== undefined && element.current) element.current.value = value;
  }, [value]);

  return <jb-range-input {...otherProps} ref={element}>{children}</jb-range-input>;
});

JBRangeInput.displayName = "JBRangeInput";
