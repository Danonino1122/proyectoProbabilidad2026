"use client";
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function PlotClient(props: PlotParams) {
  return <Plot {...props} />;
}

export const darkLayout = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#ededf0", family: "system-ui" },
  xaxis: { gridcolor: "#24242e", zerolinecolor: "#2a2a36" },
  yaxis: { gridcolor: "#24242e", zerolinecolor: "#2a2a36" },
  margin: { l: 50, r: 20, t: 30, b: 40 },
} as const;
