import type { Metadata } from "next";
import { SosScreenClient } from "@/components/emergency/SosScreenClient";

export const metadata: Metadata = {
  title: "Emergency Assistance (SOS)",
  description:
    "Immediate emergency helplines and verified 24/7 hospital, police, and fire facility directory for Kolkata Durga Puja. Dial 112.",
};

export default function SosPage() {
  return <SosScreenClient />;
}
