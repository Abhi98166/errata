import type { ReactNode } from "react";

import { Atmosphere } from "./Atmosphere";

interface Props {
  variant: string;
  left: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}

export function Frame({ variant, left, right, children }: Props) {
  return (
    <div className={`frame frame--${variant}`}>
      <div className="frame__texture" aria-hidden="true" />
      <div className="frame__glow" aria-hidden="true" />
      <div className="frame__margin" aria-hidden="true" />
      <div className="frame__vignette" aria-hidden="true" />
      <Atmosphere />

      <div className="frame__bar">
        <span>{left}</span>
        {right !== undefined && <span className="frame__meta">{right}</span>}
      </div>

      <div className="frame__body">{children}</div>
    </div>
  );
}

export function Brand() {
  return (
    <span className="brand">
      err<b>a</b>ta
    </span>
  );
}
