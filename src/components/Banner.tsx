import { useState } from "react";

export function Banner({ runtimeLabel }: { runtimeLabel: string }) {
  const [useHeaderImage, setUseHeaderImage] = useState(true);

  if (useHeaderImage) {
    return (
      <header className="banner banner-image-header">
        <picture>
          <source srcSet="./carbine-header.jpg" type="image/jpeg" />
          <img
            className="banner-image"
            src="./carbine-header.png"
            alt="CARBINE. Forest carbon insights need exploring."
            fetchPriority="high"
            decoding="async"
            onError={() => setUseHeaderImage(false)}
          />
        </picture>
        <strong className="runtime-badge image-runtime-badge">{runtimeLabel}</strong>
      </header>
    );
  }

  return (
    <header className="banner">
      <div className="banner-art" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="banner-content">
        <img
          className="banner-mark"
          src="./carbine-logo.png"
          alt=""
          aria-hidden="true"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div>
          <h1>CARBINE</h1>
          <p>Forest carbon insights need exploring.</p>
          <span>Powered by the USDA Forest Service Forest Vegetation Simulator.</span>
        </div>
      </div>
      <strong className="runtime-badge">{runtimeLabel}</strong>
    </header>
  );
}
