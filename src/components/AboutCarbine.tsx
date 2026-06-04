import { ExternalLink } from "lucide-react";

export function AboutCarbine() {
  return (
    <section className="panel about-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">About</p>
          <h2>About CARBINE</h2>
        </div>
      </div>

      <div className="about-copy">
        <p>
          CARBINE was created by Dr. Steven Bick of{" "}
          <a href="https://www.northeastforests.com" target="_blank" rel="noreferrer">
            Northeast Forests, LLC <ExternalLink size={14} />
          </a>{" "}
          and{" "}
          <a href="https://www.forestenterprise.org" target="_blank" rel="noreferrer">
            The Forest Business School <ExternalLink size={14} />
          </a>
          .
        </p>

        <p>
          Much of Dr. Bick's work focuses on making complicated tools, systems, and ideas easier to use in real business and forest management settings. The point is not to remove the power of a good technical tool, but to make that power easier to reach. Otherwise, what good is it?
        </p>

        <p>
          CARBINE follows that same idea. It is designed as a smaller, handier, more approachable way to explore forest carbon scenarios using the calculation strength of the Forest Vegetation Simulator. The goal is to help foresters, landowners, agencies, educators, and forest-based businesses get useful carbon insights without first having to master the full complexity of FVS.
        </p>

        <p>
          More of Dr. Bick's work, writing, and tools can be found at{" "}
          <a href="https://www.northeastforests.com" target="_blank" rel="noreferrer">
            Northeast Forests <ExternalLink size={14} />
          </a>
          ,{" "}
          <a href="https://www.forestenterprise.org" target="_blank" rel="noreferrer">
            The Forest Business School <ExternalLink size={14} />
          </a>
          , and the{" "}
          <a href="https://www.loggingchance.com" target="_blank" rel="noreferrer">
            Logging Chance website <ExternalLink size={14} />
          </a>
          .
        </p>

        <p>
          Contact:{" "}
          <a href="mailto:steve@northeastforests.com">
            steve@northeastforests.com <ExternalLink size={14} />
          </a>
        </p>
      </div>
    </section>
  );
}
