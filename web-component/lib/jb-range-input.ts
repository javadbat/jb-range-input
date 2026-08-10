import CSS from "./jb-range-input.css";
import { renderHTML } from "./render.js";

export class JBRangeInputWebComponent extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    const template = document.createElement("template");
    template.innerHTML = `<style>${CSS}</style>${renderHTML()}`;
    shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

if (!customElements.get("jb-range-input")) {
  customElements.define("jb-range-input", JBRangeInputWebComponent);
}
