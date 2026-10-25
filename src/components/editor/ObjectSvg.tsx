"use client";
import { memo } from "react";
import { assetUrl } from "@/lib/assets";
import { baselineY, fontStack, PT_TO_MM, textLines } from "@/lib/objects";
import { objectTransform } from "@/lib/render/svg";
import type { ArtObject } from "@/lib/types";

/** React renderer for an artwork object. Mirrors lib/render/svg.ts and lib/render/canvas.ts. */
export const ObjectSvg = memo(function ObjectSvg({ o, assetsTick }: { o: ArtObject; assetsTick: number }) {
  void assetsTick;
  const common = { transform: objectTransform(o), opacity: o.opacity };
  switch (o.type) {
    case "rect":
      return (
        <rect
          {...common}
          width={o.width}
          height={o.height}
          rx={Math.min(o.cornerRadius, o.width / 2, o.height / 2)}
          fill={o.fill ?? "none"}
          stroke={o.stroke ?? undefined}
          strokeWidth={o.stroke ? o.strokeWidth : 0}
        />
      );
    case "ellipse":
      return (
        <ellipse
          {...common}
          cx={o.width / 2}
          cy={o.height / 2}
          rx={o.width / 2}
          ry={o.height / 2}
          fill={o.fill ?? "none"}
          stroke={o.stroke ?? undefined}
          strokeWidth={o.stroke ? o.strokeWidth : 0}
        />
      );
    case "line":
      return (
        <g {...common}>
          <rect width={o.width} height={o.height} fill="transparent" />
          <line x1={0} y1={o.height / 2} x2={o.width} y2={o.height / 2} stroke={o.stroke} strokeWidth={o.strokeWidth} />
        </g>
      );
    case "path": {
      const sx = o.width / o.vbWidth;
      const sy = o.height / o.vbHeight;
      return (
        <g {...common}>
          <rect width={o.width} height={o.height} fill="transparent" />
          <path
            transform={`scale(${sx} ${sy})`}
            d={o.d}
            fill={o.fill ?? "none"}
            stroke={o.stroke ?? undefined}
            strokeWidth={o.stroke ? o.strokeWidth / ((sx + sy) / 2) : 0}
          />
        </g>
      );
    }
    case "image": {
      const href = assetUrl(o.assetId);
      const par = o.fit === "contain" ? "xMidYMid meet" : o.fit === "cover" ? "xMidYMid slice" : "none";
      return (
        <g {...common}>
          {href ? (
            <image width={o.width} height={o.height} preserveAspectRatio={par} href={href} />
          ) : (
            <rect width={o.width} height={o.height} fill="#e5e5e0" />
          )}
        </g>
      );
    }
    case "text": {
      const size = o.fontSize * PT_TO_MM;
      const ax = o.align === "left" ? 0 : o.align === "center" ? o.width / 2 : o.width;
      const anchor = o.align === "left" ? "start" : o.align === "center" ? "middle" : "end";
      return (
        <g {...common}>
          <rect width={o.width} height={o.height} fill="transparent" />
          <text
            fontFamily={fontStack(o.fontFamily)}
            fontSize={size}
            fontWeight={o.fontWeight}
            fontStyle={o.italic ? "italic" : undefined}
            letterSpacing={o.letterSpacing * size}
            textAnchor={anchor}
            fill={o.color}
            style={{ whiteSpace: "pre", userSelect: "none" }}
          >
            {textLines(o).map((line, i) => (
              <tspan key={i} x={ax} y={baselineY(o, i)}>
                {line || " "}
              </tspan>
            ))}
          </text>
        </g>
      );
    }
  }
});
