function node2mermaid(nodes, chartDirection = "TD") {
    let mermaid = `flowchart ${chartDirection}\n`;
    for (let node in nodes) {
        const nodeData = nodes[node];
       // console.log(nodeData)
        let label = nodeData.label // ? nodeData.label : nodeData.id;
        if (nodeData.type === "service") {
            label = `[${label}]`
        } else {
            label = `(${label})`
        }
        mermaid += `${nodeData.id}${label}\n`;
        for (let link of nodeData.links) {
            mermaid += `${node} --> ${link.dest}\n`;
        }
    }
    return mermaid;
}

const data ={
  "process": {
    "id": "process",
    "label": "Local Contexts Hub Labels",
    "type": "service",
    "links": [],
    "props": {}
  },
  "lc_hub": {
    "id": "lc_hub",
    "label": "LC Hub",
    "type": "service",
    "links": [],
    "props": {}
  },
  "data_repo": {
    "id": "data_repo",
    "label": "Dataverse",
    "type": "service",
    "links": [],
    "props": {}
  },
  "read_lc_hub_data": {
    "id": "read_lc_hub_data",
    "label": "Fetch project data",
    "type": "activity",
    "links": [
      {
        "dest": "lc_hub",
        "props": {
          "type": "service"
        }
      }
    ],
    "props": {}
  },
  "displayLabels": {
    "id": "displayLabels",
    "label": "Display project labels",
    "type": "activity",
    "links": [
      {
        "dest": "lc_hub",
        "props": {
          "type": "service"
        }
      },
      {
        "dest": "read_lc_hub_data",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  },
  "read_dataset": {
    "id": "read_dataset",
    "label": "Fetch dataset metadata",
    "type": "activity",
    "links": [
      {
        "dest": "data_repo",
        "props": {
          "type": "service"
        }
      }
    ],
    "props": {}
  },
  "findReference": {
    "id": "findReference",
    "label": "Find LCHub Project Reference",
    "type": "activity",
    "links": [
      {
        "dest": "data_repo",
        "props": {
          "type": "service"
        }
      },
      {
        "dest": "read_dataset",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  },
  "createLCHubReference": {
    "id": "createLCHubReference",
    "label": "Create LCHub Reference",
    "type": "activity",
    "links": [
      {
        "dest": "data_repo",
        "props": {
          "type": "service"
        }
      },
      {
        "dest": "findReference",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  },
  "updateDatasetMetadata": {
    "id": "updateDatasetMetadata",
    "label": "Update the metadata of the dataset",
    "type": "activity",
    "links": [
      {
        "dest": "data_repo",
        "props": {
          "type": "service"
        }
      },
      {
        "dest": "findReference",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  },
  "display_updated_description": {
    "id": "display_updated_description",
    "label": "Display updated dataset description",
    "type": "activity",
    "links": [
      {
        "dest": "data_repo",
        "props": {
          "type": "service"
        }
      },
      {
        "dest": "findReference",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  },
  "postDatasetMetadata": {
    "id": "postDatasetMetadata",
    "label": "Post updated metadata",
    "type": "activity",
    "links": [
      {
        "dest": "data_repo",
        "props": {
          "type": "service"
        }
      }
    ],
    "props": {}
  },
  "publishUpdatedDataset": {
    "id": "publishUpdatedDataset",
    "label": "Publish updated dataset",
    "type": "activity",
    "links": [
      {
        "dest": "data_repo",
        "props": {
          "type": "service"
        }
      },
      {
        "dest": "postDatasetMetadata",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  }
}

console.log(node2mermaid(data));