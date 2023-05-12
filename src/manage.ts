import {LoadsFiles} from "./resolver";
import {ProcessPageType} from "./data_types/process_page_types";
import {InstanceTypeEnum, schemaNameMap} from "./const";
import {alert_throw, errorsToString} from "./util";
import {initAjv, validation} from "./validate_schemas";
import {getMsg, L} from "./i18nLLL";

export async function loadPP(process_page_url: string, validate: boolean = true,error_handle: { alert_: boolean, throw_: boolean } = {
    alert_: false, throw_: false
}) {
    try {
        // fetch the process-page description file
        return  await LoadsFiles.loadInstance<ProcessPageType>({
            uri: process_page_url,
            type: InstanceTypeEnum.instanceProcessPage,
            name: "processPage"
        }, validate)
    } catch (e) {
        console.error("process page loading failed")
        console.error(e)
        alert_throw({errorMsg: e, ...error_handle})
        return Promise.reject(e)
    }
}

async function start(process_pages: string[]) {

    await initAjv("http://localhost:8000/data/schema/idstk_schema/ridagop-ids-toolkit.schema.json")

    for (let pp_uri of process_pages) {
        console.log(pp_uri)
        let processPageData : ProcessPageType
        try {
            processPageData = await loadPP(`http://localhost:8000/data/schema/idstk_schema/process_page/instances/${pp_uri}`)
        } catch (e) {
            console.error(e)
            continue
        }
        try {
            // validate the process-page description file
            const validationErrors = validation(schemaNameMap[InstanceTypeEnum.instanceProcessPage], processPageData)
            // const validationErrors = validation_errors(schemas.processPageSchema, processPageData, "processPageSchema")

            if (validationErrors.length > 0) {
                const errorMsg = getMsg("PROCESS_PAGE_SCHEMA_INVALID", {error: errorsToString(validationErrors)})
                alert_throw({errorMsg, alert_: false, throw_: false})
                // return Promise.reject(errorMsg)
            }

        } catch (e) {
            console.log(e)
        }
    }
}

export default {
    loadPP, initAjv, start
}

