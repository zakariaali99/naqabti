// Optimize 2D canvas context for getImageData readbacks (prevents Chrome warnings & improves performance)
if (typeof window !== "undefined") {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    type: any,
    ...args: any[]
  ) {
    if (type === "2d") {
      const options = args[0] || {};
      options.willReadFrequently = true;
      args[0] = options;
    }
    return (originalGetContext as any).apply(this, [type, ...args]);
  };
}

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface HeatmapLayerProps {
  points: [number, number, number][];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
  max?: number;
  gradient?: Record<number, string>;
}

export default function HeatmapLayer({
  points,
  radius = 25,
  blur = 15,
  maxZoom,
  minOpacity = 0.05,
  max = 1.0,
  gradient,
}: HeatmapLayerProps) {
  const map = useMap();
  const heatLayerRef = useRef<L.HeatLayer | null>(null);

  // Initialize the heat layer once and register zoom end handler
  useEffect(() => {
    const layer = (L as any).heatLayer([], {
      radius,
      blur,
      maxZoom: maxZoom ?? map.getZoom(),
      max,
      minOpacity,
      ...(gradient ? { gradient } : {}),
    });
    layer.addTo(map);
    heatLayerRef.current = layer;

    const handleZoomEnd = () => {
      if (heatLayerRef.current && maxZoom === undefined) {
        heatLayerRef.current.setOptions({ maxZoom: map.getZoom() });
      }
    };

    map.on("zoomend", handleZoomEnd);

    return () => {
      map.off("zoomend", handleZoomEnd);
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, maxZoom]);

  // Update data and options in-place when they change
  useEffect(() => {
    if (heatLayerRef.current) {
      heatLayerRef.current.setLatLngs(points);
      heatLayerRef.current.setOptions({
        radius,
        blur,
        max,
        minOpacity,
        ...(gradient ? { gradient } : {}),
      });
    }
  }, [points, radius, blur, max, minOpacity, gradient]);

  return null;
}
