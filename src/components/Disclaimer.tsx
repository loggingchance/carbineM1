import { Coffee } from "lucide-react";

export function Disclaimer() {
  return (
    <footer className="disclaimer">
      <span>
        CARBINE is independently developed and is not an official USDA Forest Service product. It is powered by the USDA Forest Service Forest Vegetation Simulator.
        Users are responsible for reviewing inputs, assumptions, variant selection, and interpretation of outputs.
      </span>
      <a className="support-link" href="https://venmo.com/u/Steven-Bick-1" target="_blank" rel="noreferrer">
        <Coffee size={17} aria-hidden="true" /> Enjoying CARBINE? Buy me a coffee
      </a>
    </footer>
  );
}
