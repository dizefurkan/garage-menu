"use client";

import { Suspense } from "react";
import { AcceptInviteFlow } from "./accept-invite-flow";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInviteFlow />
    </Suspense>
  );
}
