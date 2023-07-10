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
