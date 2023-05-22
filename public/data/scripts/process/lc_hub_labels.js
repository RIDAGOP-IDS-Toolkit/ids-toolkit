/**
 * this is for when one would have a client-module bridge
 * @param project_id
 * @return {Promise<Response>}
 */
export async function read_project_data(project_id) {
    const data =  fetch(`https://localcontextshub.org/api/v1/projects/${project_id}`)
    return Promise.resolve(data)
}

function createLCHubLabelHTMLElement(lc_hub_project_data) {
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

export function display_project_labels(lc_hub_project_data) {
    return createLCHubLabelHTMLElement(lc_hub_project_data)
}

function dataFormat(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function createLCHubReference2(lc_hub_project_data) {
    /**
     * this uses the new local contexts metadata block
     * @type {HTMLDivElement}
     */
    console.log("lc_hub_project_data", lc_hub_project_data)

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

export function createLCHubReference(lc_hub_project_data) {
    /**
     * creates an element to be included in the citation metadata block
     * @type {HTMLDivElement}
     */
    const displayElement = createLCHubLabelHTMLElement(lc_hub_project_data)
    // console.log("******************************")
    // console.log("<br><br>" + displayElement.outerHTML + "<br>")
    return "<br><br>" + displayElement.outerHTML + "<br>"
}

export function shouldPublish(persistentId, type) {
    // console.log("should publish", persistentId, type)
    const dataset = getIDS().getStorageValue("dataset", "data_repo")
    if (dataset.data.latestVersion.versionState === "DRAFT") {
        throw new Error("draft will not be published", {cause: "cancel"})
    }
}

export function checkProjectID(project_id) {
    console.log(project_id)
    const uuidRegex = new RegExp("[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}")
    // project_id.match(uuidRegex)
    const uuidMatch = project_id.match(uuidRegex)
    console.log(uuidMatch)
    if (uuidMatch) {
        return {project_id: uuidMatch[0]}
    } else return new Error(cause = "cancel")
}