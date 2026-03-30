import { round } from "@excalidraw/math";
import { getCommonBounds } from "@excalidraw/element";

import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

import type { AppState } from "../../types";

import { getElementDisplayTopLeft } from "./utils";

export interface ElementCoordinatesProps {
  /** Selected elements (non-deleted). For multiple elements, the axis-aligned selection bounds top-left is shown. */
  elements: readonly NonDeletedExcalidrawElement[];
  appState: AppState;
}

/**
 * Read-only X/Y scene coordinates for the current selection, matching the values used by the Stats position inputs.
 */
export const ElementCoordinates = ({
  elements,
  appState,
}: ElementCoordinatesProps) => {
  if (elements.length === 0) {
    return null;
  }

  let x: number;
  let y: number;

  if (elements.length === 1) {
    const coords = getElementDisplayTopLeft(elements[0], appState);
    x = coords.x;
    y = coords.y;
  } else {
    const [x1, y1] = getCommonBounds(elements);
    x = round(x1, 2);
    y = round(y1, 2);
  }

  return (
    <div
      className="exc-stats__row"
      style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      data-testid="element-coordinates"
      aria-label={`X ${x}, Y ${y}`}
    >
      <div>X</div>
      <div style={{ textAlign: "right" }}>{x}</div>
      <div>Y</div>
      <div style={{ textAlign: "right" }}>{y}</div>
    </div>
  );
};
