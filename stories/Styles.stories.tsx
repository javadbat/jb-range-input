import { useEffect, useRef } from "react";
import { JBRangeInput } from "jb-range-input/react";
import type { JBRangeInputWebComponent } from "jb-range-input";
import type { Meta, StoryObj } from "@storybook/react-vite";
import "../../../docs/styles/ant-design.css";
import "../../../docs/styles/aurora.css";
import "../../../docs/styles/bootstrap.css";
import "../../../docs/styles/candy.css";
import "../../../docs/styles/carbon.css";
import "../../../docs/styles/cupertino.css";
import "../../../docs/styles/fluent.css";
import "../../../docs/styles/forest.css";
import "../../../docs/styles/material.css";
import "../../../docs/styles/porcelain.css";
import "../../../docs/styles/sunset.css";
import "../../../docs/styles/terminal.css";
import "./styles/style-ant-design.css";
import "./styles/style-aurora.css";
import "./styles/style-bootstrap.css";
import "./styles/style-candy.css";
import "./styles/style-carbon.css";
import "./styles/style-cupertino.css";
import "./styles/style-fluent.css";
import "./styles/style-forest.css";
import "./styles/style-material.css";
import "./styles/style-porcelain.css";
import "./styles/style-sunset.css";
import "./styles/style-terminal.css";

const meta = {
  title: "Components/form elements/JBRangeInput/Style",
  component: JBRangeInput,
} satisfies Meta<typeof JBRangeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const styleSamples = [
  { name: "Carbon", className: "carbon-style" },
  { name: "Aurora", className: "aurora-style" },
  { name: "Forest", className: "forest-style" },
  { name: "Sunset", className: "sunset-style" },
  { name: "Porcelain", className: "porcelain-style" },
  { name: "Candy", className: "candy-style" },
  { name: "Terminal", className: "terminal-style" },
  { name: "Material", className: "material-style" },
  { name: "Fluent", className: "fluent-style" },
  { name: "Bootstrap", className: "bootstrap-style" },
  { name: "Cupertino", className: "cupertino-style" },
  { name: "Ant Design", className: "ant-design-style" },
];

function RangeInputStyleSample({ className }: { className: string }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "1.25rem",
        minWidth: 0,
        width: "100%",
      }}
    >
      <RangeInputWithPreview className={className} />
      <JBRangeInput className={className} label="Price range" mode="range" min={0} max={100} tickStep={25} minorTickStep={5} value={[20, 80]} />
      <JBRangeInput className={className} label="Unavailable value" min={0} max={10} value={4} error="Choose another value" />
      <JBRangeInput className={className} label="Disabled" min={0} max={10} value={6} disabled />
    </div>
  );
}

function RangeInputWithPreview({ className }: { className: string }) {
  const element = useRef<JBRangeInputWebComponent>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const handle = element.current?.shadowRoot?.querySelector<SVGCircleElement>("[part~='range-handle']");
      handle?.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return <JBRangeInput ref={element} className={className} label="Volume" min={0} max={100} tickStep={25} showTickLabels value={65} />;
}

export const Gallery: Story = {
  name: "Gallery",
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))",
        gap: "1.25rem",
        alignItems: "start",
        width: "min(100%, 82rem)",
      }}
    >
      {styleSamples.map(sample => (
        <section
          key={sample.className}
          className={sample.className}
          style={{
            display: "grid",
            gap: "0.75rem",
            minWidth: 0,
            padding: "1rem",
            background: "var(--jb-surface, #ffffff)",
            border: "1px solid var(--jb-border-color, #e5e7eb)",
            borderRadius: "0.75rem",
            boxShadow: "0 0.75rem 1.75rem oklch(0% 0 0 / 0.08)",
          }}
        >
          <div
            style={{
              color: "var(--jb-content-primary, #334155)",
              fontSize: "0.875rem",
              fontWeight: 700,
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            {sample.name}
          </div>
          <RangeInputStyleSample className={sample.className} />
        </section>
      ))}
    </div>
  ),
};

export const Default: Story = { render: () => <RangeInputStyleSample className="" /> };
export const Carbon: Story = { render: () => <RangeInputStyleSample className="carbon-style" /> };
export const Aurora: Story = { render: () => <RangeInputStyleSample className="aurora-style" /> };
export const Forest: Story = { render: () => <RangeInputStyleSample className="forest-style" /> };
export const Sunset: Story = { render: () => <RangeInputStyleSample className="sunset-style" /> };
export const Porcelain: Story = { render: () => <RangeInputStyleSample className="porcelain-style" /> };
export const Candy: Story = { render: () => <RangeInputStyleSample className="candy-style" /> };
export const Terminal: Story = { render: () => <RangeInputStyleSample className="terminal-style" /> };
export const Material: Story = { render: () => <RangeInputStyleSample className="material-style" /> };
export const Fluent: Story = { render: () => <RangeInputStyleSample className="fluent-style" /> };
export const Bootstrap: Story = { render: () => <RangeInputStyleSample className="bootstrap-style" /> };
export const Cupertino: Story = { render: () => <RangeInputStyleSample className="cupertino-style" /> };
export const AntDesign: Story = { name: "Ant Design", render: () => <RangeInputStyleSample className="ant-design-style" /> };
