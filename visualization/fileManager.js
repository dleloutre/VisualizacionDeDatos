import * as THREE from "three";
import { Subgraph } from "./graph/subgraph";

export function loadCSV(url) {
    return fetch(url)
      .then((response) => response.text())
      .then(
        (rawCSV) =>
          Papa.parse(rawCSV, {
            header: false,
            dynamicTyping: true,
            skipEmptyLines: true,
            delimiter: ";",
          }).data
      );
}

export async function loadFiles(keys, bgraphkey = '', joint = false) {
    const nodeFilePrefix = `/nodes${bgraphkey}/dataset_`;
    const edgeFilePrefix = `/edges${bgraphkey}/dataset_`;
    const subgraphs = [];
    let i = 0;

    for (const key of keys) {
      const subgraph = new Subgraph(i, key);
      const nodeFile = nodeFilePrefix + key + '.csv';
      const nodes = await loadCSV(nodeFile);
      subgraph.setNodes(nodes);

      if (!joint) {
        const edgeFile = edgeFilePrefix + key + '.csv';
        const edges = await loadCSV(edgeFile);
        subgraph.setEdges(edges);
      }

      subgraphs.push(subgraph);
      i++;
    }
    const crossingEdges = await loadCSV(edgeFilePrefix + "crossing.csv");

    return { subgraphs, crossingEdges };
}

export function validateMetadata(metadata) {
    // if all keys are missing a color definition, it assigns randomly
    // if some keys are missing a color definition, it assigns white
    const missingKeyColor = Object.values(metadata).every(property => !property.color);
    if (missingKeyColor) {
      const numColors = Object.keys(metadata).length;
      const red = new THREE.Color("#FF0000");
      const blue = new THREE.Color("#0000FF");
      const colors = [];
        
      colors.push(red);
      for (let j = 1; j <= numColors - 2; j++) {
        const hue = (j / (numColors - 1)) * 0.7;
        const saturation = 1.0;
        const lightness = 0.5;
        colors.push(new THREE.Color().setHSL(hue, saturation, lightness));
      }
      colors.push(blue);
      let i = 0;
      for (const key in metadata) {
        metadata[key].color = `#${colors[i].getHexString()}`;
        i += 1;
      }
    }
    // TODO: if missing data.json, obtain keys from dataset filenames
    return metadata;
}