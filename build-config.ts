import type { ReactComponentBuildConfig, WebComponentBuildConfig } from "../../tasks/build/builder/src/types.ts";

export const webComponentList: WebComponentBuildConfig[] = [
  {
    name: "jb-range-input",
    path: "./web-component/lib/jb-range-input.ts",
    outputPath: "./web-component/dist/jb-range-input.js",
    tsConfigPath: "./web-component/tsconfig.json",
    external: ["jb-core"],
    globals: {
      "jb-core": "JBCore",
    },
    umdName: "JBRangeInput",
  },
];

export const reactComponentList: ReactComponentBuildConfig[] = [
  {
    name: "jb-range-input-react",
    path: "./react/lib/JBRangeInput.tsx",
    outputPath: "./react/dist/JBRangeInput.js",
    external: ["jb-range-input", "react"],
    globals: {
      react: "React",
      "jb-range-input": "JBRangeInput",
    },
    umdName: "JBRangeInputReact",
    dir: "./react",
  },
];
