"use client";

import * as React from "react";

import { CreatorProfile } from "$app/parsers/profile";

import { FollowForm } from "$app/components/Profile/FollowForm";

export const ProfileSubscribe = ({
  creatorProfile,
  buttonLabel,
}: {
  creatorProfile: CreatorProfile;
  buttonLabel: string;
}) => (
  <div style={{ maxWidth: "500px" }}>
    <FollowForm creatorProfile={creatorProfile} buttonLabel={buttonLabel} buttonColor="primary" />
  </div>
);
