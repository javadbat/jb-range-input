"use client";

import React, { type PropsWithChildren, useEffect, useImperativeHandle } from "react";
import "jb-range-input";
import type { JBRangeInputWebComponent, RangeInputMode, RangeInputValue, SizeVariants } from "jb-range-input";
import "./module-declaration.js";

export type JBRangeInputProps = PropsWithChildren<
  React.HTMLAttributes<JBRangeInputWebComponent> & {
    min?: number;
    max?: number;
    step?: number;
    tickStep?: number;
    minorTickStep?: number | null;
    showTickLabels?: boolean;
    showPersianNumber?: boolean;
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
>;

export const JBRangeInput = React.forwardRef<JBRangeInputWebComponent, JBRangeInputProps>((props, ref) => {
  const element = React.useRef<JBRangeInputWebComponent>(null);
  useImperativeHandle(ref, () => element.current!, []);

  const { value, initialValue, startPoint, tickLabelFormatter, children, ...otherProps } = props;
  useEffect(() => {
    if (value !== undefined && element.current) element.current.value = value;
  }, [value]);
  useEffect(() => {
    if (initialValue !== undefined && element.current) element.current.initialValue = initialValue;
  }, [initialValue]);
  useEffect(() => {
    if (startPoint !== undefined && element.current) {
      (element.current as JBRangeInputWebComponent & { startPoint: number }).startPoint = startPoint;
    }
  }, [startPoint]);
  useEffect(() => {
    if (element.current) element.current.tickLabelFormatter = tickLabelFormatter ?? (tickValue => String(tickValue));
  }, [tickLabelFormatter]);

  return (
    <jb-range-input {...otherProps} ref={element}>
      {children}
    </jb-range-input>
  );
});

JBRangeInput.displayName = "JBRangeInput";
