import { bindWebGLLayer, createMetaballsProgram } from "@sigma/layer-webgl";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { parse } from "graphology-gexf/browser";
import Sigma from "sigma";

import { onStoryDown } from "../utils";

export default () => {
  let globalRenderer: Sigma | null = null;

  // Load external GEXF file:
  fetch("./arctic.gexf")
    .then((res) => res.text())
    .then((gexf) => {
      // Parse GEXF string:
      const graph = parse(Graph, gexf);
      louvain.assign(graph, { nodeCommunityAttribute: "community" });
      const communities = new Set<string>();
      graph.forEachNode((_, attrs) => communities.add(attrs.community));

      // Retrieve some useful DOM elements:
      const container = document.getElementById("sigma-container") as HTMLElement;

      // Instantiate sigma:
      const renderer = new Sigma(graph, container);
      globalRenderer = renderer;

      // Add Select
      const select = document.createElement("select");
      select.innerHTML =
        `<option value="">No community</option>` +
        Array.from(communities)
          .map((str) => `<option value="${str}">Community ${str}</option>`)
          .join("");
      select.style.position = "absolute";
      select.style.right = "10px";
      select.style.bottom = "10px";
      document.body.append(select);

      // Handle metaballs layer:
      let cleanWebGLLayer: null | (() => void) = null;
      select.addEventListener("change", () => {
        if (cleanWebGLLayer) cleanWebGLLayer();

        const community = select.value;
        if (community) {
          cleanWebGLLayer = bindWebGLLayer(
            "metaball",
            renderer,
            createMetaballsProgram(graph.filterNodes((_node, attributes) => attributes.community === +community)),
          );
        } else {
          cleanWebGLLayer = null;
        }
      });
    });

  onStoryDown(() => {
    globalRenderer?.kill();
  });
};
