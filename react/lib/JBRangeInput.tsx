"use client";

import React, { type PropsWithChildren, useImperativeHandle } from "react";
import "jb-range-input";
import type { JBRangeInputWebComponent } from "jb-range-input";
import "./module-declaration.js";

export type JBRangeInputProps = PropsWithChildren<React.HTMLAttributes<JBRangeInputWebComponent>>;

export const JBRangeInput = React.forwardRef<JBRangeInputWebComponent, JBRangeInputProps>((props, ref) => {
  const element = React.useRef<JBRangeInputWebComponent>(null);
  useImperativeHandle(ref, () => element.current!, []);

  return <jb-range-input {...props} ref={element}>{props.children}</jb-range-input>;
});

JBRangeInput.displayName = "JBRangeInput";
