export function findLCHubProjectReference(datasetData, lc_hub_project_data) {
  /**
   * this looks at the description field of the citation metadata block
   */
  if (datasetData.hasOwnProperty("data")) {
    datasetData = datasetData.data
  }
  const citationMetadata = datasetData.latestVersion.metadataBlocks?.citation || {}
  const fields = citationMetadata?.fields || []
  const descriptions = fields.filter(field => field.typeName === "dsDescription")
  let found = false
  descriptions.forEach(description => {
    description.value.forEach(dValue => {
      const text = dValue.dsDescriptionValue.value
      // console.log("***",text)
      // this check could be even more precise taking the
      // if (!text.includes("https://localcontextshub.org/projects")
      //     || !text.includes("https://anth-ja77-lc-dev-42d5.uc.r.appspot.com/projects")) {
      //
      // }
      const indexOfDateModified = text.indexOf("lchub-date_modified")
      if (indexOfDateModified !== -1) {
        const dateStart = text.indexOf('"', indexOfDateModified)
        const dateEnd = text.indexOf('"', dateStart + 1)
        const date_modified = text.substring(dateStart + 1, dateEnd)
        if (date_modified === lc_hub_project_data.date_modified) {
          found = true
        }
      }
    })
  })
  console.log("found", found)
  return found
}

export function findLCHubProjectReference2(datasetData, lc_hub_project_data) {
  if (datasetData.hasOwnProperty("data")) {
    datasetData = datasetData.data
  }
  const localContextMetadata = datasetData.latestVersion.metadataBlocks?.local_contexts_labels || null
  const latest_modification = Date.parse(lc_hub_project_data.date_modified)
  // console.log(latest_modification)
  // debugger
  for (let field in localContextMetadata.fields) {
    if (field.name === "date_modified") {
      // console.log(Date.parse(field.value), Date.parse(lc_hub_project_data.date_modified))
      if (Date.parse(field.value) < Date.parse(lc_hub_project_data.date_modified)) {
        return false
      }
    }
  }
  if (!localContextMetadata) {
    return false
  }
  return true
}


export function updateDatasetMetadata2(datasetData, referenceFound, referenceData) {
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


export function updateDatasetMetadata(datasetData, referenceFound, referenceText) {
  /**
   * Updates the description in the citation metadata block
   */
  if (datasetData.hasOwnProperty("data")) {
    datasetData = datasetData.data
  }
  if (!referenceFound) {
    const fields = datasetData.latestVersion.metadataBlocks.citation.fields
    const descriptions = fields.filter(field => field.typeName === "dsDescription")
    const firstDescription = descriptions[0]
    // remove existing reference. identified by the id: lc_hub_project_reference
    var temp_el = document.createElement('div')
    temp_el.innerHTML = `<div>${firstDescription.value[0].dsDescriptionValue.value}</div>`
    const outdated_ref = temp_el.querySelector("#lc_hub_project_reference")
    if (outdated_ref) {
      outdated_ref.remove()
      firstDescription.value[0].dsDescriptionValue.value = temp_el.innerText + referenceText
    } else {
      firstDescription.value[0].dsDescriptionValue.value += referenceText
    }
  }
  const result = {metadataBlocks: datasetData.latestVersion.metadataBlocks}
  if (datasetData.latestVersion.termsOfAccess) {
    result.termsOfAccess = datasetData.latestVersion.termsOfAccess
  }
  if (datasetData.latestVersion.termsOfUse) {
    result.termsOfUse = datasetData.latestVersion.termsOfUse
  }
  return result
}

export function display_updated_description(updatedMetadata, referenceFound) {

  const fields = updatedMetadata.metadataBlocks.citation.fields
  const descriptions = fields.filter(field => field.typeName === "dsDescription")
  const firstDescription = descriptions[0]

  // const output = document.querySelector("#data_repo_output")
  let prependText = "Reference exists already. Description not updated"
  if (!referenceFound) {
    prependText = "Reference not found or outdated. Description will be changed to:"
  }
  prependText = `<div><b><u>${prependText}</u></b><br><br></div>`
  return prependText + firstDescription.value[0].dsDescriptionValue.value
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