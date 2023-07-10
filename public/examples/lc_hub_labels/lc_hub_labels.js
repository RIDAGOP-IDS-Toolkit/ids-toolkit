/**
 * this is for when one would have a client-module bridge
 * @param project_id
 * @return {Promise<Response>}
 */
export async function read_project_data(project_id) {
  const data = fetch(`https://localcontextshub.org/api/v1/projects/${project_id}`)
  return Promise.resolve(data)
}

/**
 * preProcess function of the "read_lc_hub_data" activity.
 * Checks if the passed text contains a valid local contexts hub project id (uuid)
 * @param project_id
 * @return {Error|{project_id: *}}
 */
export function checkProjectID(project_id) {
  // console.log(project_id)
  const uuidRegex = new RegExp("[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}")
  // project_id.match(uuidRegex)
  const uuidMatch = project_id.match(uuidRegex)
  // console.log(uuidMatch)
  if (uuidMatch) {
    return {project_id: uuidMatch[0]}
  } else return new Error(cause = "cancel")
}

/**
 * this function is used in order to display the project labels in the output section
 * @param lc_hub_project_data
 * @return {HTMLDivElement}
 */
export function display_project_labels(lc_hub_project_data) {
  const lc_hub_project = document.createElement("div")
  // important. will be removed, if there is an update
  lc_hub_project.setAttribute("id", "lc_hub_project_reference")
  const title_elem = document.createElement("div")
  const labels_list = document.createElement("div")

  const header = document.createElement("div")
  header.innerText = "Project labels:"
  header.style["font-size"] = "24px"
  title_elem.style["font-size"] = "18px"
  title_elem.style["font-weight"] = "bold"
  title_elem.style["margin-top"] = "15px"
  lc_hub_project.appendChild(header)
  lc_hub_project.appendChild(title_elem)

  const creatorBlock = document.createElement("div")
  let creatorBlockHtml = "<span>Created by: </span>"
  let num = 0
  for (let creator of lc_hub_project_data.created_by) {
    const comma = num > 0 ? ", " : ""
    if (creator.institution) {
      creatorBlockHtml += `<span>${comma}${creator.institution.institution_name}</span>`
    } else if (creator.reseacher) {
      creatorBlockHtml += `<span>${comma}${creator.esearcher.user}</span>`
    } else if (creator.community) {
      creatorBlockHtml += `<span>${comma}${creator.community}</span>`
    }
    num++
  }
  creatorBlock.innerHTML = creatorBlockHtml
  lc_hub_project.appendChild(creatorBlock)

  const modifiedDatetime = document.createElement("div")
  // this attribute name is important for checking if the project has been updated
  modifiedDatetime.setAttribute("lchub-date_modified", lc_hub_project_data.date_modified)
  modifiedDatetime.innerText = "Last modified: " + lc_hub_project_data.date_modified
  lc_hub_project.appendChild(modifiedDatetime)

  lc_hub_project.appendChild(labels_list)

  labels_list.innerHTML = ""
  title_elem.innerHTML = `<a href="${lc_hub_project_data.project_page}">${lc_hub_project_data.title}</a><br><br>`

  lc_hub_project.style.display = "block"

  const labelBase = document.createElement("div")
  labelBase.innerHTML = '<div style="display: flex"><div style="padding-top: 1.5%;">' + '<div><img style="height: 70px; max-width: 120px"/></div></div>' + '<div style="padding-left: 2%;"><p class="label_name" style="color: #007585;"></p>' + '<p class="label_type" style="font-weight: bold;"></p>' + '<p class="label_text"></p>' + '</div></div><div style="border-bottom: 1px solid #007385;margin-top: 1%"></div><br><br>'
  lc_hub_project.appendChild(document.createElement("br"))
  lc_hub_project.appendChild(document.createElement("br"))

  // lc_hub_project.appendChild(labelBase)

  for (let label_type of ["notice", "tk_labels", "bc_labels"]) {
    // console.log(result[label_type])
    for (let label of lc_hub_project_data[label_type] || []) {
      const elem = labelBase.cloneNode(true)
      elem.id = label.unique_id
      // console.log("image", elem.querySelector("img"))
      elem.querySelector("img").src = label.img_url
      // notices do not have a community
      elem.querySelector(".label_name").innerText = label.community || ""
      elem.querySelector(".label_type").innerText = label.name
      // notices only have a default text
      elem.querySelector(".label_text").innerText = label.label_text || label.default_text
      elem.style = "display:block"
      labels_list.appendChild(elem)
    }
  }
  return lc_hub_project
}

/**
 * this is used in order to format the dates when creating references...
 * @param dateString
 * @return {string}
 */
function dataFormat(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


/**
 * convert the project data into the dataverse metadatablock format
 * @param lc_hub_project_data
 * @return json object according to the dataverse metadatablock format for local contexts hub projects
 */
export function createLCHubReference(lc_hub_project_data) {

  // console.log("lc_hub_project_data", lc_hub_project_data)

  const to_be_inserted = {}
  lc_hub_project_data.created_by.forEach((created_by) => {
    if (created_by.institution) {
      if (!to_be_inserted.institution) {
        to_be_inserted.institution = {
          "typeName": "lcl.createdBy.institution", "multiple": true, "typeClass": "primitive", "value": []
        }
      }
      to_be_inserted.institution.value.push(created_by.institution.institution_name)
    }
    if (created_by.researcher) {
      if (!to_be_inserted.researcher) {
        to_be_inserted.researcher = {
          "typeName": "lcl.createdBy.researcher", "multiple": true, "typeClass": "compound", "value": []
        }
      }
      to_be_inserted.researcher.value.push(
        {
          "lcl.createdBy.researcher.name": {
            "typeName": "lcl.createdBy.researcher.name",
            "multiple": false,
            "typeClass": "primitive",
            "value": created_by.researcher.user
          }, "lcl.createdBy.researcher.orcid": {
            "typeName": "lcl.createdBy.researcher.orcid",
            "multiple": false,
            "typeClass": "primitive",
            "value": created_by.researcher.orcid
          }
        }
      )
    }
    if (created_by.community) {
      if (!to_be_inserted.community) {
        to_be_inserted.community = {
          "typeName": "lcl.createdBy.community",
          "multiple": true,
          "typeClass": "primitive",
          "value": []
        }
      }
      to_be_inserted.community.value.push(created_by.community)
    }
  })

  const metadata = {
    "displayName": "Local Contexts Labels", "name": "local_contexts_labels", "fields": [{
      "typeName": "lcl.projectPage",
      "multiple": false,
      "typeClass": "primitive",
      "value": lc_hub_project_data.project_page
    }, {
      "typeName": "lcl.projectTitle",
      "multiple": false,
      "typeClass": "primitive",
      "value": lc_hub_project_data.title
    }, {
      "typeName": "lcl.date_added",
      "multiple": false,
      "typeClass": "primitive",
      "value": dataFormat(lc_hub_project_data.date_added)
    }, {
      "typeName": "lcl.date_modified",
      "multiple": false,
      "typeClass": "primitive",
      "value": lc_hub_project_data.date_modified
    }
    ]
  }

  Object.values(to_be_inserted).forEach(value => {
    metadata.fields.push(value)
  })

  const template_notices = {
    "typeName": "lcl.notice",
    "multiple": true,
    "typeClass": "compound",
    value: []
  }

  for (let notice of lc_hub_project_data?.notice || []) {
    template_notices.value.push({
      "lcl.notice.name": {
        "typeName": "lcl.notice.name",
        "multiple": false,
        "typeClass": "primitive",
        "value": notice.name
      },
      "lcl.notice.type": {
        "typeName": "lcl.notice.type",
        "multiple": false,
        "typeClass": "controlledVocabulary",
        "value": notice.notice_type
      },
      "lcl.notice.img_url": {
        "typeName": "lcl.notice.img_url",
        "multiple": false,
        "typeClass": "primitive",
        "value": notice.img_url
      },
      "lcl.notice.default_text": {
        "typeName": "lcl.notice.default_text",
        "multiple": false,
        "typeClass": "primitive",
        "value": notice.default_text
      },
      "lcl.notice.createdAt": {
        "typeName": "lcl.notice.createdAt",
        multiple: false,
        typeClass: "primitive",
        value: dataFormat(notice.date_added)
      }
    })
  }

  if (template_notices.value.length > 0) {
    metadata.fields.push(template_notices)
  }

  const labelClassTemplates = {
    tk_labels: {
      "typeName": "lcl.tkLabel",
      "multiple": true,
      "typeClass": "compound",
      value: []
    },
    bc_labels: {
      "typeName": "lcl.bcLabel",
      "multiple": true,
      "typeClass": "compound",
      value: []
    }
  }

  const subfieldName = {
    tk_labels: "lcl.tkLabel",
    bc_labels: "lcl.bcLabel"
  }


  for (let labelClass of ["tk_labels", "bc_labels"]) {
    // debugger
    const sfn = subfieldName[labelClass]
    for (let label of lc_hub_project_data[labelClass] || []) {
      labelClassTemplates[labelClass].value.push({
        [`${sfn}.name`]: {
          "typeName": `${sfn}.name`,
          "multiple": false,
          "typeClass": "primitive",
          "value": label.name
        },
        [`${sfn}.type`]: {
          "typeName": `${sfn}.type`,
          "multiple": false,
          "typeClass": "controlledVocabulary",
          "value": label.label_type
        },
        [`${sfn}.language`]: {
          "typeName": `${sfn}.language`,
          "multiple": false,
          "typeClass": "primitive",
          "value": label.language
        },
        [`${sfn}.text`]: {
          "typeName": `${sfn}.text`,
          "multiple": false,
          "typeClass": "primitive",
          "value": label.label_text
        },
        [`${sfn}.img_url`]: {
          "typeName": `${sfn}.img_url`,
          "multiple": false,
          "typeClass": "primitive",
          "value": label.img_url || ""
        },
        [`${sfn}.audiofile`]: {
          "typeName": `${sfn}.audiofile`,
          "multiple": false,
          "typeClass": "primitive",
          "value": label.audiofile || ""
        },
        [`${sfn}.community`]: {
          "typeName": `${sfn}.community`,
          "multiple": false,
          "typeClass": "primitive",
          "value": label.community
        },
        [`${sfn}.createdAt`]: {
          "typeName": `${sfn}.createdAt`,
          "multiple": false,
          "typeClass": "primitive",
          "value": dataFormat(label.created)
        }
      })
    }

    if (labelClassTemplates[labelClass].value.length > 0) {
      metadata.fields.push(labelClassTemplates[labelClass])
    }
  }


  console.log("final metadata", metadata)
  return metadata
}


/**
 * this it the preProcess function of the "publishUpdatedDataset" activity,
 * which itself is a sub-activity of "postDatasetMetadata"
 * @param persistentId
 * @param type
 */
export function shouldPublish(persistentId, type) {
  // console.log("should publish", persistentId, type)
  const dataset = Window.getToolkit().getStorageValue("dataset", "data_repo")
  if (dataset.data.latestVersion.versionState === "DRAFT") {
    throw new Error("draft will not be published", {cause: "cancel"})
  }
}

/**
 * Check if the dataverse dataset has a reference to the LC-Hub project and if yes if it is outdated.
 *
 * @param datasetData
 * @param lc_hub_project_data
 * @return {boolean}
 */
export function findLCHubProjectReference(datasetData, lc_hub_project_data) {
  if (datasetData.hasOwnProperty("data")) {
    datasetData = datasetData.data
  }
  const localContextMetadata = datasetData.latestVersion.metadataBlocks?.local_contexts_labels || null
  if (!localContextMetadata) {
    return false
  }
  // get the date_modified field and compare it with the date_modified of the LC-Hub project
  for (let field of localContextMetadata.fields) {
    if (field.typeName  === "lcl.date_modified") {
      // console.log(Date.parse(field.value), Date.parse(lc_hub_project_data.date_modified))
      if (Date.parse(field.value) < Date.parse(lc_hub_project_data.date_modified)) {
        return false
      }
    }
  }

  return true
}


/**
 * this function takes the dataverse dataset metadata and the LC-Hub project metadata and updates the dataset metadata.
 * @param datasetData
 * @param referenceFound
 * @param referenceData
 * @return {{metadataBlocks}}
 */
export function updateDatasetMetadata(datasetData, referenceFound, referenceData) {
  if (datasetData.hasOwnProperty("data")) {
    datasetData = datasetData.data
  }
  datasetData.latestVersion.metadataBlocks.local_contexts_labels = referenceData
  const result = {metadataBlocks: datasetData.latestVersion.metadataBlocks}
  if (datasetData.latestVersion.termsOfAccess) {
    result.termsOfAccess = datasetData.latestVersion.termsOfAccess
  }
  if (datasetData.latestVersion.termsOfUse) {
    result.termsOfUse = datasetData.latestVersion.termsOfUse
  }
  return result
}


/**
 * this activity is an indicator if the dataset metadata needs to
 * be updated or not (if there is no local contexts metadata or if it is outdated)
 * @param referenceFound
 * @return {string}
 */
export function display_updated_description(referenceFound) {

  // const output = document.querySelector("#data_repo_output")
  let prependText = "Reference exists already."
  if (!referenceFound) {
    prependText = "Reference not found or outdated. Metadata will be added."
  }
  prependText = `<div><b><u>${prependText}</u></b><br><br></div>`
  return prependText
}


/**
 * @deprecated We can use the OpenAPI endpoint
 * @param dataverseInstance
 * @param datasetId
 * @param apiKey
 * @param datasetData
 * @param metadata
 * @return {Promise<unknown>}
 */
export async function postDatasetMetadata(dataverseInstance, datasetId, apiKey, datasetData, metadata) {

  let baseUrl = dataverseInstance
  if (datasetData.hasOwnProperty("data")) {
    datasetData = datasetData.data
  }
  if (!baseUrl.startsWith("https://")) {
    baseUrl = "https://" + baseUrl
  }
  if (datasetData.latestVersion.versionState === "DRAFT") {
    return fetch(`${baseUrl}/api/datasets/:persistentId/versions/:draft/?persistentId=${datasetId}`,
      {
        body: JSON.stringify(metadata),
        method: "PUT",
        mode: 'cors',
        headers: {
          "X-Dataverse-key": apiKey,
          "Content-Type": "application/json"
        }
      })
  } else {
    return new Promise((resolve, reject) => {
      // console.log("MEETTA")
      // console.log("metadata", metadata)

      fetch(`${baseUrl}/api/datasets/:persistentId/versions/:draft/?persistentId=${datasetId}`,
        {
          body: JSON.stringify(metadata),
          method: "PUT",
          mode: "cors",
          headers: {"X-Dataverse-key": apiKey, "Content-Type": "application/json"}
        }).then(response => {
        console.log("success")
        console.log(response)
        if (response.status !== 200) {
          reject(`Response status is: ${response.status}`)
        }
        return resolve(response)
      }, response => {
        console.log("ERR")
        console.log(response)
        return reject(`Response status is: ${response.status}`)
      })
    })
  }
}