function node2mermaid(nodes, chartDirection = "TD") {
    let mermaid = `flowchart ${chartDirection}\n`;
    for (let node in nodes) {
        const nodeData = nodes[node];
        // console.log(nodeData)
        let label = nodeData.label // ? nodeData.label : nodeData.id;
        switch (nodeData.type) {
            case "service":
                label = `[${label}]`
                break;
            case "activity":
                label = `[/${label}\\]`
                break
            case "bridge":
                label = `[[${label}]]`
                break
            case "module":
                label= `((${label}))`
                break
            default:
                console.warn("type", nodeData.type)
        }
        mermaid += `${nodeData.id}${label}\n`;
        for (let link of nodeData.links) {
            mermaid += `${node} --> ${link.dest}\n`;
        }
    }
    console.log("************")
    return mermaid;
}

const data = {
  "service_process": {
    "id": "process",
    "label": "Local Contexts Hub Labels",
    "type": "service",
    "links": [],
    "props": {}
  },
  "service_lc_hub": {
    "id": "lc_hub",
    "label": "LC Hub",
    "type": "service",
    "links": [],
    "props": {}
  },
  "bridge_data_repo": {
    "id": "data_repo",
    "label": "data_repo",
    "type": "bridge",
    "links": [],
    "props": {}
  },
  "service_data_repo": {
    "id": "data_repo",
    "label": "Dataverse",
    "type": "service",
    "links": [],
    "props": {}
  },
  "module_process_module": {
    "id": "process_module",
    "label": "process_module",
    "type": "module",
    "links": [],
    "props": {}
  },
  "activity_read_lc_hub_data": {
    "id": "read_lc_hub_data",
    "label": "Fetch project data",
    "type": "activity",
    "links": [
      {
        "dest": "service_lc_hub",
        "props": {
          "type": "service"
        }
      }
    ],
    "props": {}
  },
  "activity_displayLabels": {
    "id": "displayLabels",
    "label": "Display project labels",
    "type": "activity",
    "links": [
      {
        "dest": "activity_read_lc_hub_data",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  },
  "activity_read_dataset": {
    "id": "read_dataset",
    "label": "Fetch dataset metadata",
    "type": "activity",
    "links": [
      {
        "dest": "service_data_repo",
        "props": {
          "type": "service"
        }
      }
    ],
    "props": {}
  },
  "activity_findReference": {
    "id": "findReference",
    "label": "Find LCHub Project Reference",
    "type": "activity",
    "links": [
      {
        "dest": "activity_read_dataset",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  },
  "activity_createLCHubReference": {
    "id": "createLCHubReference",
    "label": "Create LCHub Reference",
    "type": "activity",
    "links": [
      {
        "dest": "activity_findReference",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  },
  "activity_updateDatasetMetadata": {
    "id": "updateDatasetMetadata",
    "label": "Update the metadata of the dataset",
    "type": "activity",
    "links": [
      {
        "dest": "activity_findReference",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  },
  "activity_display_updated_description": {
    "id": "display_updated_description",
    "label": "Display updated dataset description",
    "type": "activity",
    "links": [
      {
        "dest": "activity_findReference",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  },
  "activity_postDatasetMetadata": {
    "id": "postDatasetMetadata",
    "label": "Post updated metadata",
    "type": "activity",
    "links": [
      {
        "dest": "service_data_repo",
        "props": {
          "type": "service"
        }
      }
    ],
    "props": {}
  },
  "activity_publishUpdatedDataset": {
    "id": "publishUpdatedDataset",
    "label": "Publish updated dataset",
    "type": "activity",
    "links": [
      {
        "dest": "activity_postDatasetMetadata",
        "props": {
          "type": "parent"
        }
      }
    ],
    "props": {}
  }
}

console.log(node2mermaid(data));