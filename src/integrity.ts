import {toArray} from "./util";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import ProcessPage from "./models/process_page_model";
import {Bridge} from "./models/bridge_models";
import {ProcessPageServiceType, ProcessPageType} from "./data_types/process_page_types";
import {
    BasicActivityReferenceType,
    ProcessCommonsType,
    ProcessParamType,
    ProcessServiceActivityType,
    ProcessServiceType,
    ProcessType
} from "./data_types/ProcessTypes";
import {StoreContextEnum} from "./store_wrapper";

type ServiceIntegrityCheck = {
    processPageService: boolean,
    requiredActivities: boolean,
    storageAccess: boolean
    sequencesInvalid: boolean
}

export function checkProcessPageServices(process: ProcessType, processPage: ProcessPage,
                                         throw_: boolean | ServiceIntegrityCheck) {

    // check if throw_ is boolean or object. If boolean, convert to object
    if (typeof throw_ === "boolean") {
        throw_ = {
            processPageService: throw_,
            requiredActivities: throw_,
            storageAccess: throw_,
            sequencesInvalid: throw_
        }
    }

    /**
     * Check if services in Process-Page are defined in process and vice versa
     */
    const serviceNames = processPage.getServiceNames()
    for (let serviceName of serviceNames) {
        if (!(serviceName in process.services)) {
            const msg = `Service '${serviceName}' from Process-Page is not defined in Process`
            if (throw_.processPageService)
                throw msg
            else
                console.error(msg)
        }
    }

    for (let serviceName of Object.keys(process.services)) {
        if (!serviceNames.includes(serviceName)) {
            const msg = `Service '${serviceName}' from Process is not defined in Process-Page`
            if (throw_.processPageService)
                throw msg
            else
                console.error(msg)
        }
    }

    // general service checks
    for (let [serviceName, service] of Object.entries(process.services)) {
        // checkServiceActivityCapabilities(service, serviceName, processPage.getServicesBridge(serviceName))
        const failed = checkSequences(service)
        if (!isEmpty) {
            const msg = `Sequence for service: ${serviceName} is invalid: ${failed}}`
            if (throw_.sequencesInvalid)
                throw failed
            else
                console.error(failed)
        }
    }

    /**
     * Check if for each activity all required activities are defined
     */
    if (!checkRequiredActivities(process)) {
        const msg = `checkRequiredActivities failed`
        if (throw_.requiredActivities)
            throw msg
        else
            console.error(msg)
    }

    /**
     * Check for all activities if they do proper storage access
     */
    if (!checkStorageAccess(process)) {
        const msg = "checkStorageAccess failed"
        if (throw_.storageAccess)
            throw msg
        else
            console.error(msg)
    }
}

export function checkProcessActivities(process: ProcessType, processPage: ProcessPage): boolean {
    /**
     * TODO call it again
     */
    for (let [serviceName, service] of Object.entries(process.services)) {
        checkServiceActivityCapabilities(service, serviceName, processPage.getServicesBridge(serviceName))
    }
    return true
}

export function checkServiceActivitiesOnlyModuleFunctions(service: any) {
// TODO maybe in init.
    /*
    check if the service-definitions that do not have a bridge, if all their activities
    are module-functions not capabilites
     */
}

export function checkServiceActivityCapabilities(service: ProcessServiceType, serviceName: string, bridge: Bridge<any>) {
    /**
     * Check if the BridgeCapabilities that are specified for a process-service exists in the bridges passed to processPage
     */
    // console.log(process.activities || {})
    // TODO
    // for (let [activity_name, activity] of Object.entries(process.activities || {})) {
    //     if (!(activity.bridgeCapability in bridge.capabilities)) {
    //         console.error(`${activity_name} in process-activity is not provided by bridge of service ${serviceName}`)
    //     }
    // }
}

/**
 * Check if all the activities specified in the sequences exist.
 * @param service
 * @return {Array} list of failed sequences with the missing activities
 */
export function checkSequences(service: ProcessServiceType | ProcessCommonsType)
    : { sequenceName: string, missingActivity: string }[] {
    // check for all sequences if they are defined in the activities
    const failed: { sequenceName: string, missingActivity: string }[] = []
    for (let [sequenceName, sequence] of Object.entries(service.sequences || {})) {
        for (let activityName of sequence.activities) {
            if (!(activityName in service.activities)) {
                console.error(`Sequence '${sequenceName}' references activity '${activityName}' that does not exists`)
                failed.push({sequenceName, missingActivity: activityName})
            }
        }
    }
    return failed
}

/**
 * Check that the activities specified in the autostart field do exists
 * @param processData
 * @param processPageData
 */
export function checkAutoStartActivities(processData: ProcessType, processPageData: ProcessPageType):
    BasicActivityReferenceType[] {

    const not_found: BasicActivityReferenceType[] = []

    /**
     *
     * @param projectService
     * @param projectPageService this is just for logging
     * @param serviceName
     */
    function checkServiceAutostartActivities(
        projectService: ProcessServiceType,
        projectPageService: ProcessPageServiceType,
        serviceName: string
    ): boolean {
        const activityNames = Object.keys(projectService.activities || {})

        const checkAllAutostartActivities = (autostartData: string | string[], isProcessPageData: boolean) => {
            for (let activityName of toArray<string>(autostartData)) {
                if (!activityNames.includes(activityName)) {
                    console.error(`Service: '${projectService.title}' specifies an autostart activity` +
                        ` (in the ${isProcessPageData ? 'Process-Page-file' : 'Process-file'}): ` +
                        `'${activityName}' that does not exists`)
                    not_found.push({activityName, serviceName})
                }
            }
            return true
        }

        return !((!checkAllAutostartActivities(projectPageService.autostart || [], true)) ||
            (!checkAllAutostartActivities(projectService.autostart || [], false)));

    }

    // run for each service
    for (let [serviceName, serviceData] of Object.entries(processData.services)) {
        // todo, this should be validated before. it should exist.
        const processPageServiceData = processPageData.services[serviceName]
        checkServiceAutostartActivities(serviceData, processPageServiceData, serviceName)
    }
    return not_found
}


export function processInputFields(process: ProcessType) {
    /**
     * Check if the `input_fields` specified in a process match the parameters of the bridgeCapabilities
     * specified in the activities
     */

}


function checkRequiredActivities(process: ProcessType): boolean {
    /**
     * Go through all services of a process and check for each of their activities, if their 'requiredActivities' exists,
     *
     * @param activityReq
     */

    const checkExistence = (activityReq: BasicActivityReferenceType) => {
        if (!(activityReq.serviceName in process.services)) {
            return false
        }
        const service = process.services[activityReq.serviceName]
        return activityReq.activityName in service.activities
    }

    for (let [serviceName, service] of Object.entries(process.services)) {
        for (let [activity_name, activity] of Object.entries(service.activities || {})) {
            for (let req of activity.requiredActivities || []) {
                const toCheck = {
                    serviceName: req.serviceName || serviceName,
                    activityName: req.activityName
                }
                if (!checkExistence(toCheck)) {
                    console.error(`Service: '${service.title}' contains the activity: '${activity.title}', which`
                        + `defines a required activity that does not exist: '${toCheck.serviceName}/${toCheck.activityName}'`
                    )
                    return false
                }
            }
        }
    }

    return true
}


function checkStorageAccess(process: ProcessType): boolean {
    const processStore: string[] = []

    const checkExistence = (store: string[], storeVariable: string) => {
        for (let storedVariable of store) {
            if (isEqual(storedVariable, storeVariable))
                return true
        }
        return false
    }

    const logErrorMessage = (serviceTitle: string,
                             activity: ProcessServiceActivityType,
                             paramData: ProcessParamType,
                             context: StoreContextEnum,
                             key: string) =>
        console.error(`Service: '${serviceTitle}', activity: '${activity.title}' requests the variable ${key} from context: '${context}' that was not defined before`)

    function recursiveCheckServiceAndAdd(activity: ProcessServiceActivityType, serviceTitle: string, serviceCache: string[]): boolean {
        /**
         * Check if all store, cache variables the activity requires are defined before. Add the store, cache variables that activity creates
         */
        for (let [paramName, paramData] of Object.entries(activity.parameters || {})) {
            if (paramData.serviceStore) {
                if (!checkExistence(serviceCache, paramData.serviceStore)) {
                    // console.log("ERR-srcCacheKey", paramData)
                    logErrorMessage(serviceTitle, activity, paramData, StoreContextEnum.SERVICE, paramData.serviceStore)
                    return false
                }
            }
        }

        // console.log("K", activity.storeKey, activity.cacheKey)
        if (activity.storeResult) {
            const context = activity.storeResult.context || StoreContextEnum.SERVICE
            if (context === StoreContextEnum.SERVICE) {
                serviceCache.push(activity.storeResult.key)
            } else {
                processStore.push(activity.storeResult.key)
            }
            // console.log(activity.storeKey)
        }

        for (let [activity_name, subActivity] of Object.entries(activity.subActivities || {})) {
            // console.log("CS", activity_name)
            if (!recursiveCheckServiceAndAdd(subActivity, serviceTitle, serviceCache)) {
                return false
            }
        }

        return true
    }

    function recursiveCheckProcessAndAdd(activity: ProcessServiceActivityType, serviceTitle: string, serviceCache: string[]): boolean {
        /**
         * Check if process store, cache variables the activity requires are defined before
         */
        for (let [paramName, paramData] of Object.entries(activity.parameters || {})) {
            // console.log(paramName)
            if (paramData.processStore) {
                if (!checkExistence(processStore, paramData.processStore)) {
                    console.log("ERR-srcStoreKey", paramData)
                    logErrorMessage(serviceTitle, activity, paramData, StoreContextEnum.PROCESS, paramData.processStore)
                    return false
                }
            }
        }
        return true
    }

    /* go through all services */
    for (let context of [StoreContextEnum.SERVICE, StoreContextEnum.PROCESS]) {
        for (let [serviceName, service] of Object.entries(process.services)) {
            // console.log("--", serviceName)
            const serviceCache: string[] = []
            /* Go through all activities */
            for (let [activity_name, activity] of Object.entries(service.activities || {})) {
                // console.log("C", activity_name)
                if (context === StoreContextEnum.SERVICE) {
                    if (!recursiveCheckServiceAndAdd(activity, service.title, serviceCache)) {
                        return false
                    }
                } else {
                    if (!recursiveCheckProcessAndAdd(activity, service.title, serviceCache)) {
                        return false
                    }
                }
            }
        }
    }
    return true
}