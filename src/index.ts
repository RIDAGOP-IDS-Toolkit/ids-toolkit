import {alert_throw, errorsToString} from "./util";
import {initAjv, validation} from "./validate_schemas";
import {createProcessUI, mapProcessUI} from "./ui";
import {checkAutoStartActivities} from "./integrity";
import {getMsg, L} from "./i18nLLL";
import isEmpty from "lodash/isEmpty";
import ProcessPage from "./models/process_page_model";
import IDS, {getIDS, setIDS} from "./models/ids_model";
import {ProcessPageType} from "./data_types/process_page_types";
import {InstanceTypeEnum, schemaNameMap, UIModeEnum} from "./const";
import DevHelper from "./dev_helper";
import {__devRun} from "./dev";
import manage from "./manage";

const packageJson = require('../package.json');


let currentLanguage = "en"

/**
 * The initialization function. Takes the process-page description file url as input.
 * It starts with initializing Ajv (json-schema validation library), with the all required schemas.
 *
 * @param process_page_url the url of the process-page desription file
 * @param alert_ flag, if alerts should be evoked, if some steps of the initialization fail
 * @param throw_ flag, if exceptions should be thrown, if some steps of the initializaion fail
 * @param eventCallback callback function, that will be called, when an event is triggered (experimental)
 */
export async function _init_toolkit_(process_page_url: string,
                                 alert_: boolean = true,
                                 throw_: boolean = true,
                                 eventCallback: Function): Promise<IDS> {
    const NODE_ENV = process.env.NODE_ENV
    console.debug("VERSION:", packageJson.version, NODE_ENV)
    if (NODE_ENV === 'development') {
        console.log('Project is in development mode')
        window.__DevHelper = new DevHelper()
    }
    let processPageData: ProcessPageType
    try {
        processPageData = await manage.loadPP(process_page_url, false)
    } catch (e) {
        console.error(e)
        const errorMsg = "process page loading failed: " + e
        alert_throw({errorMsg, alert_, throw_})
        return Promise.reject(errorMsg)
    }
    // initialize Ajv with all required json-schemas
    try {
        await initAjv(processPageData.schemaUri)
    } catch (e) {
        const errorMsg = "loading relevant schemas failed: " + e
        alert_throw({errorMsg, alert_, throw_})
        return Promise.reject(errorMsg)
    }

    let processPage: ProcessPage
    let ids: IDS
    let errorMsg: string
    try {
        // validate the process-page description file
        const validationErrors = validation(schemaNameMap[InstanceTypeEnum.instanceProcessPage], processPageData)
        // const validationErrors = validation_errors(schemas.processPageSchema, processPageData, "processPageSchema")

        if (validationErrors.length > 0) {
            errorMsg = getMsg("PROCESS_PAGE_SCHEMA_INVALID", {error: errorsToString(validationErrors)})
            alert_throw({errorMsg, alert_, throw_: true})
            // return Promise.reject(errorMsg)
        }
        // create Process-page object
        processPage = new ProcessPage(process_page_url, processPageData)
        // create IDS-TK object
        ids = new IDS(processPage, eventCallback)
        // add the IDS-TK object to the window, for global access
        setIDS(ids)
        // load the process-page data (including, bridges, the process and script files)
        await processPage.load()
        // create the service activities
        processPage.createServiceActivities()
        // update webpage title based on the process-page
        processPage.setPageTitle()
    } catch (e) {
        console.error(e)
        errorMsg = "process page loading failed: " + e
        alert_throw({errorMsg, alert_, throw_})
        return Promise.reject(errorMsg)
    }

    const inactiveActivities = processPage.getAllInactiveActivities()
    // Notify user about inactive activities
    if (!isEmpty(inactiveActivities)) {
        let inactiveActivitiesString = ""
        for (let activity of inactiveActivities) {
            inactiveActivitiesString += `${activity.service.title}:${activity.title}\n`
        }
        const errorMsg = L.en.INACTIVE_ACTIVITIES({activities: inactiveActivitiesString})
        alert_throw({errorMsg, alert_, throw_: false})
    }

    // Initiate page user-interface, either building the UI
    if (processPage.view.type === UIModeEnum.build) {
        console.debug("Building UI")
        createProcessUI(processPage)
    } else { // map
        mapProcessUI(processPage)
    }
    processPage.mapServiceActivitiesParameters()

    try {
        /** get out when autostart activities are missing */
        const missingActivities = checkAutoStartActivities(processPage.process.data, processPageData)
        if (missingActivities.length > 0) {
            let not_found = ""
            missingActivities.forEach(e => {
                not_found += `${e.serviceName}:${e.activityName};`
            })
            const errorMsg = getMsg("AUTOSTART_WAS_NOT_EXECUTED", {not_found})
            // console.log(errMsg)
            alert_throw({errorMsg, alert_, throw_})
            return Promise.reject(errorMsg)
        }
        // run auto-start activities
        await processPage.autostart()
    } catch (e) {
        alert_throw({errorMsg: e, alert_, throw_})
        return Promise.reject(e)
    }

    // load scripts
    // console.log(window._IDS.process)
    /*
    await Promise.all(ids.process.scripts.map(loadProcessScript))
    if (window["init_process"] !== undefined) {
        window["init_process"]()
    }
    */

    // collectSecurityComponents(ids.process, ids.services)
    if (NODE_ENV === 'development') {
        __devRun()
    }
    return Promise.resolve(ids)
}


/**
 * Allow global access (for typescript)
 */
declare global {
    interface Window {
        currentLanguage: string
        _init_toolkit_: Function
        manage: object
        __IDS_GLOBALS__: IDS
        getIDS: Function
        __DevHelper: DevHelper
    }
}

window.currentLanguage = currentLanguage
window._init_toolkit_ = _init_toolkit_
window.manage = manage
window.getIDS = getIDS


