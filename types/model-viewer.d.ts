// JSX typing for the <model-viewer> custom element (@google/model-viewer)
import * as React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        "ios-src"?: string;
        poster?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "camera-controls"?: boolean;
        "touch-action"?: string;
        loading?: string;
        reveal?: string;
        "shadow-intensity"?: string;
        "auto-rotate"?: boolean;
        style?: React.CSSProperties;
      };
    }
  }
}
