"use client";

import React from "react";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";

export default function SuperAdminProfilePage() {
  return <ProfileSettingsForm role="owner" />;
}
