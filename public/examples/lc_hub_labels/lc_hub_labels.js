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
