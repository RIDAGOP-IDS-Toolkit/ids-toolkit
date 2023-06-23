const DATAVERSE_API_KEY_NAME = "X-Dataverse-key"

export async function module_createDataset(serverUri, apiKey, dataverseIdentifier, body) {
  // we got this with OpenAPI
  console.log(body)
  return await fetch(`${serverUri}/api/dataverses/${dataverseIdentifier}/datasets`,
      {
        method: "POST",
        body: body,
        headers: {[DATAVERSE_API_KEY_NAME]: apiKey, "content-Type": "application/json"}
      })
}

export async function module_createPrivateUrl(serverUri, apiKey, datasetCreateResponse) {
  // we got this with OpenAPI
  if (datasetCreateResponse.persistentId) {
    const result = await fetch(`${serverUri}/api/datasets/:persistentId/privateUrl?persistentId=${datasetCreateResponse.persistentId}`,
        {
          method: "POST",
          headers: {[DATAVERSE_API_KEY_NAME]: apiKey}
        })
    const {data} = await result.json()
    return `<div>Private url: <a href="${data.link}" target="_blank">${data.link}</a></div>`
  } else {
    Promise.reject("No persistentId in datasetCreateResponse")
  }
}

export async function module_addFileToDataset(serverUri, apiKey, datasetIdentifier, body) {
  // we got this with OpenAPI
  const formData = new FormData()
  formData.append("file", body.file)
  if (body.jsonData) {
    formData.append("jsonData", body.jsonData)
  }

  return await fetch(`${serverUri}/api/datasets/:persistentId/add?persistentId=${datasetIdentifier}`,
      {
        method: "POST",
        body: formData,
        headers: {[DATAVERSE_API_KEY_NAME]: apiKey}
      })
}

export async function module_listdatasetFiles(serverUri, apiKey, datasetIdentifier) {
  // we got this with OpenAPI
  return await fetch(`${serverUri}/api/datasets/:persistentId/versions/:draft/files?persistentId=${datasetIdentifier}`,
      {
        method: "GET",
        headers: {[DATAVERSE_API_KEY_NAME]: apiKey}
      })
}

export async function module_downloadFile(serverUri, apiKey, fileId) {
  return await fetch(`${serverUri}/api/access/datafile/${fileId}`,
      {
        method: "GET",
        headers: {[DATAVERSE_API_KEY_NAME]: apiKey}
      })
}

// TEST

export function test_DATAPATH_VAR(version) {
  console.log("test_DATAPATH_VAR", version)
  return version
}

/**
 * Use the dataset file-list to create a bunch of selects
 */
export function createFileSelectOption(files) {
  return {
    "selects": {
      "file": {
        "label": "File to download",
        "options": files.data.map(file => {
          return {
            "label": file.label,
            "value": file.dataFile.id.toString()
          }
        })
      }
    },
    "buttons": {
      "download": {
        "label": "Download file",
        "triggerActivity": "downloadFileDyn"
      },
      "downloadAll": {
        "label": "Download all files",
        "triggerActivity": "downloadAll"
      }
    }
  }
}

export async function downloadAndReUpload(files) {
  console.log(files)
  // console.log(files.data[0].dataFile.id)

  // for dataverse-tests
  // let id = await getIDS().getValue("dataverse", "file")
  // console.log(id)

  let res = await getIDS().executeActivity("dataverse", "download_file", {
    fileId: files.data[2].dataFile.id
  })
  console.log(res)
  // reupload file to another dataset
  // const file = new File([res], files.data[2].dataFile.filename, {type: files.data[2].dataFile.contentType})
  // await getIDS().executeActivity("dataverse", "addFile", {"persistentId": "doi:10.5072/FK2/7YEHNO"}, {"file": file})
  return {}
}


export async function copy_dataset_files(dataset_metadata) {
  // console.log(dataset_metadata)
  // console.log(files.data[0].dataFile.id)

  const files = dataset_metadata.data.latestVersion.files
  // console.log("files", files)
  const newDataSet = getIDS().getStorageValue("newDatasetId")
  const newDatasetPersistentId = newDataSet.data.persistentId
  // console.log(newDatasetPersistentId)

  for (let i = 0; i < files.length; i++) {
    const dataFile = files[i].dataFile
    let res = await getIDS().executeActivity("dataverse", "download_file", {
      fileId: dataFile.id
    })
    console.log(res)
    // reupload file to another dataset
    const fileContent = new File([res], dataFile.filename, {type: dataFile.contentType})
    await getIDS().executeActivity("dataverse", "addFile", {"persistentId": newDatasetPersistentId}, {"file": fileContent})
  }

  return {}
}