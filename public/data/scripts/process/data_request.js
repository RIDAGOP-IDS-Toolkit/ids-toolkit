export function storeData(dataset_id, motivation, email) {
    /**
     * merge data for the store it to grab it later
     */
    if (dataset_id === "") {
        return Promise.reject("No dataset id provided")
    }
    if (motivation === "") {
        return Promise.reject("No motivation provided")
    }
    console.warn("Calling store-data", dataset_id, motivation, email)
    return {
        dataset_id,
        motivation,
        email
    }
}

export async function sendEmail(response_page_url, dataverse_instance, receiver, dataset_id, motivation, applicationData, email) {
    console.log("sendEmail", receiver, motivation, applicationData)
    // const subject_ = subject + ": " +data.body.title

    const subject = "Data access request"
    const paramS = response_page_url.indexOf("?") !== -1 ? encodeURIComponent("&") : encodeURIComponent("?")
    const href = `${response_page_url}${paramS}request_id=${applicationData.filename}`
    console.log("href", decodeURIComponent(href))
    const body = "Data access request by " + encodeURIComponent(email) + `.\n See the dataset here ${dataverse_instance}/dataset.xhtml?persistentId=${dataset_id} .Click here to respond to the request: ${href}`
// https://demo.dataverse.org/dataset.xhtml?
    // console.log(body)
    window.location.href = `mailto:${receiver}?subject=${subject}&body=${body}`
    // alert("Your Email client will now open!")
    return Promise.resolve("Your Email client will now open!")
}

export function generate_process_id() {
    const length = 24; // 8 random characters
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    const array = new Uint8Array(length)
    window.crypto.getRandomValues(array)
    for (let i = 0; i < array.length; i++) {
        result += characters[array[i] % characters.length]
    }
    return `${result}.json`
}

export function createRequestHtml(requestData) {
    // create some html that includes requestData.dataset_id and requestData.motivation and email
    const resultHtml = "<p>Dataset id: " + requestData.dataset_id + "</p>" +
        "<p>Motivation: " + requestData.motivation + "</p>" +
        "<p>Email: " + requestData.email + "</p>"
    const wrapper = document.createElement("div")
    wrapper.innerHTML = resultHtml
    return wrapper
}

/**
 *
 * for the response
 *
 * **/

export function rejectRequest(requestData, rejectReason) {
    // console.log(requestData, rejectReason)
    const subject = "Data access request rejected"
    // const body = "Data access request by " + encodeURIComponent(email) + ". Click here to respond to the request: " + href
    const body = "Your request for the dataset " + requestData.dataset_id + " has been rejected. Reason: " + rejectReason
    window.location.href = `mailto:${requestData.email}?subject=${subject}&body=${body}`
}

export function acceptRequest(requestData) {
    console.log(requestData)
    return requestData.dataset_id
}

export function changeDatasetMetaData(dataset_metadata) {
    console.log("gonna fiddle with the data now")
    console.log(dataset_metadata)
    let metadataBlocks
    if (dataset_metadata.data) {
        metadataBlocks = dataset_metadata.data.latestVersion.metadataBlocks
    }

    const titleField = metadataBlocks.citation.fields.find(field => field.typeName === "title")
    titleField.value = titleField.value + " < SHARED >"
    let result = {
        "datasetVersion": {
            metadataBlocks
        }
    }
    return result
}

export function uploadNewDatasetTEST(newDataset) {
    console.log("gonna upload new dataset now")
    console.log(newDataset)
    return newDataset
}

export function sendAcceptEmail(requestData, privateUrl) {
    const subject = "Data access request rejected"
    // const body = "Data access request by " + encodeURIComponent(email) + ". Click here to respond to the request: " + href
    const body = "Your request for the dataset " + requestData.dataset_id + " has been accepted. " +
        "Read the dataset description for terms of use. The dataset is available here: " + encodeURIComponent(privateUrl)
    console.log(requestData)
    console.log(privateUrl)
    window.location.href = `mailto:${requestData.email}?subject=${subject}&body=${body}`
}