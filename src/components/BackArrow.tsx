import { ArrowLeft } from "lucide-react";
import "./back-arrow.css";

export default function BackArrow({ onClick, label, className = "" }: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return <button type="button" onClick={onClick} aria-label={label} className={`site-back-arrow ${className}`}>
    <ArrowLeft size={18} strokeWidth={1.65} aria-hidden="true" />
  </button>;
}
