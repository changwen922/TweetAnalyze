import { useSigma } from "@react-sigma/core";
import { keyBy, omit } from "lodash";
import { FC, PropsWithChildren, useEffect } from "react";

import { Dataset, FiltersState } from "../types";

const GraphDataController: FC<PropsWithChildren<{ dataset: Dataset; filters: FiltersState }>> = ({
  dataset,
  filters,
  children,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  /**
   * Feed graphology with the new dataset:
   */
  useEffect(() => {
    if (!graph || !dataset) return;

    const clusters = keyBy(dataset.clusters, "key");
    const tags = keyBy(dataset.tags, "key");

    dataset.nodes.forEach((node) =>
      graph.addNode(node.key, {
        ...node,
        ...omit(clusters[node.cluster], "key"),
        image: `./images/${tags[node.tag].image}`,
      }),
    );
    dataset.edges.forEach(([source, target]) => graph.addEdge(source, target, { size: 1 }));

    // Use degrees as node sizes:
    const scores = graph.nodes().map((node) => graph.getNodeAttribute(node, "score"));
    const minDegree = Math.min(...scores);
    const maxDegree = Math.max(...scores);
    const MIN_NODE_SIZE = 10;
    const MAX_NODE_SIZE = 40;
    graph.forEachNode((node) =>
      graph.setNodeAttribute(
        node,
        "size",
        ((graph.getNodeAttribute(node, "score") - minDegree) / (maxDegree - minDegree)) *
          (MAX_NODE_SIZE - MIN_NODE_SIZE) +
          MIN_NODE_SIZE,
      ),
    );

    return () => graph.clear();
  }, [graph, dataset]);

  /**
   * Apply filters to graphology:
   */
  useEffect(() => {
    const { clusters, tags } = filters;
    graph.forEachNode((node, { cluster, tag }) =>
      graph.setNodeAttribute(node, "hidden", !clusters[cluster] || !tags[tag]),
    );
  }, [graph, filters]);
  

  return <>
    {/* {console.log('children:',children)} */}
    {children}
    </>;
};

export default GraphDataController;