import ProcessPage from "./process_page_model";
import {HasModule, LoadsFiles} from "../resolver";
import {Service} from "./service_model";
import Module_wrapper from "./module_wrapper";
import {Bridge} from "./bridge_models";
import {
    ActivityReferenceType,
    BasicActivityReferenceType, ProcessCommonsType,
    ProcessServiceActivityType,
    ProcessServiceSequenceType,
    ProcessServiceType,
    ProcessType
} from "../data_types/ProcessTypes";
import {ModuleType} from "../data_types/bridge_types";
import {BaseService} from "./base_service";
import {FunctionSourceEnum, InstanceTypeEnum, ServiceTypeEnum} from "../const";
import {Activity} from "./activity_models";
import {ServiceUIElements} from "./ui_element_models";
import {checkProcessPageServices} from "../integrity";
import {getMsg} from "../i18nLLL";
import {DataSourceType} from "../data_types/generic";
import {getToolkit} from "./tk_model";


/**
 * Process class, which holds all services
 */
export default class Process extends BaseService<ProcessType> implements HasModule {

    // parent process page
    processPage: ProcessPage
    // all services of the process
    services: { [serviceName: string]: Service } = {}
    // module of the process, which can be used by activities
    module: Module_wrapper // todo make private##    active: boolean

    constructor(processPage: ProcessPage, processData: ProcessType) {
        // process as service
        const title = processPage.title || processData.title || "Process"
        super("process", title, ServiceTypeEnum.process, processData as ProcessType)
        this.processPage = processPage
        // todo, not sure if using defaults in the schema would be good.
        this.UIElements = new ServiceUIElements(this, processData?.common?.ui ?? {})
        this.description = processData.description || ""
    }

    static async loadProcess(processPage: ProcessPage,
                             processSource: DataSourceType<ProcessType>,
                             processPageModule: ModuleType,
                             validate: boolean = true): Promise<Process> {
        let instance: ProcessType
        try {
            instance = await LoadsFiles.loadInstance<ProcessType>({
                ...processSource,
                type: InstanceTypeEnum.instanceProcess,
                name: InstanceTypeEnum.instanceProcess,
                location: LoadsFiles.getSourceLocationDefinition(InstanceTypeEnum.instanceProcessPage, InstanceTypeEnum.instanceProcess)
            }, validate)
        } catch (e) {
            return await Promise.reject(e)
        }
        try {
            checkProcessPageServices(instance, processPage, {
                processPageService: true,
                requiredActivities: true,
                storageAccess: true,
                sequencesInvalid: true,
            })
        } catch (error) {
            return Promise.reject(getMsg("PROCESS_SERVICES_INVALID", {error}))
        }

        // todo do this afterwards and check module functions as well
        // if (!checkProcessActivities(processData, this)) {
        //     return Promise.reject("checkProcessActivities failed")
        // }
        const process = new Process(processPage, instance)
        await process.loadServices()
        await process.loadModule(processPageModule)
        return Promise.resolve(process)
    }

    /**
     * Loads the process-module and merges it with the process-page module in order to create
     * the module of the process
     */
    async loadModule(processPageModule: ModuleType): Promise<void> {
        if (this.data.scriptUri) {
            try {
                // this might fail
                let processModule: ModuleType = {}
                const sourceMap: { [functionName: string]: FunctionSourceEnum } = {} // for descriptions. store process-page or process
                try {
                    const sourceType = this.data.uri ? InstanceTypeEnum.instanceProcessPage
                        : InstanceTypeEnum.instanceProcess
                    const source = LoadsFiles.getSourceLocationDefinition(sourceType, InstanceTypeEnum.moduleProcess)
                    processModule = await LoadsFiles.importModule(
                        this.data.scriptUri,
                        InstanceTypeEnum.moduleProcess,
                        source)
                    for (let funcName in Object.keys(processModule)) {
                        sourceMap[funcName] = FunctionSourceEnum.process
                    }
                } catch (e) {
                    const msg = `Could not import process-page module of (${this.title}), module uri: ${this.data.scriptUri}`
                    console.error(msg + ".  " + e)
                    throw msg + ".  " + e
                }
                // merge with process-page module
                const resultModule: ModuleType = {}
                for (let module of [processModule, processPageModule]) {
                    for (let [funcName, func] of Object.entries(module)) {
                        if (resultModule[funcName]) {
                            console.warn("Overwriting process-module function: ", funcName, "with function from process-page module")
                        }
                        resultModule[funcName] = func
                        sourceMap[funcName] = FunctionSourceEnum.processPage
                    }
                }
                this.module = new Module_wrapper(resultModule, sourceMap)
                await Promise.resolve()
            } catch (e) {
                return Promise.reject(e)
            }
        }
    }


    /**
     * Loads the process-module and merges it with the process-page module in order to create
     * the module of the process. Then it loads the services and the activities
     *
     */
    async loadServices() {
        for (let [serviceName, processService] of Object.entries(this.data.services)) {
            const processPageServiceDescr = this.processPage.getServiceDescription(serviceName)
            let serviceBridge: Bridge<any>
            if (processService.bridge) {
                // @ts-ignore
                const uriS = processService.bridge.uri ? "at: " + processService.bridge.uri : "with data."
                console.debug(`service: ${serviceName} is defining its bridge ${uriS}`)
                try {
                    serviceBridge = await Bridge.loadBridge(
                        serviceName,
                        processService.bridge,
                        LoadsFiles.getSourceLocationDefinition(InstanceTypeEnum.instanceProcess, InstanceTypeEnum.instanceBridge, serviceName),
                        true)
                } catch (e) {
                    throw e
                }
            } else {
                console.debug(`service: ${serviceName} is getting bridge from process-page`)
                serviceBridge = this.processPage.getServicesBridge(serviceName)
                console.debug("...", serviceBridge)
                if (!serviceBridge) {
                    throw `Service ${serviceName} has no bridge defined.`
                }
            }
            this.services[serviceName] = new Service(serviceName,
                this,
                processService as ProcessServiceType,
                processPageServiceDescr,
                serviceBridge
            )
        }
    }

    getCommonData(): ProcessCommonsType {
        return this.data?.common ?? {}
    }

    /**
     * Get the definition the activities.
     * Defines the abstract BaseService method.
     * This can differ from service activities because it can contain references to other activities.
     * @return {Object} map activityName -> activityDefinition
     */
    getActivityData(): { [activityName: string]: (ProcessServiceActivityType | ActivityReferenceType) } {
        // todo use: getCommonData
        return this.data?.common?.activities || {}
    }

    /**
     * From base-service: Get the sequences from data.
     */
    getSequencesData(): { [sequenceName: string]: ProcessServiceSequenceType } {
        // todo use: getCommonData
        return this.data?.common?.sequences || {}
    }

    /**
     * From base-service: this
     */
    getProcess() {
        return this
    }

    /**
     * Returns the function of the process-module
     * Implements from HasModule interface
     * @param functionName name of the function
     */
    getModuleFunction(functionName: string): Function {
        return this.module.getModuleFunction(functionName)
    }

    /**
     * Returns true if the process-module has the function
     * Implements from HasModule interface
     * @param functionName name of the function
     */
    hasModuleFunction(functionName: string): boolean {
        return this.module.hasModuleFunction(functionName)
    }

    getActivity({serviceName, activityName}: BasicActivityReferenceType): Activity {
        // console.log(this.services, this.services[serviceName])
        if (!(serviceName in this.services)) {
            throw `Service '${serviceName}' not found. ${serviceName}.${activityName}.`
        }
        return this.services[serviceName].activities[activityName]
    }

    getAutostartActivities(): string[] {
        let pAutostart = this.data?.common?.autostart ?? []
        pAutostart  = Array.isArray(pAutostart) ? pAutostart : [pAutostart];
        let ppAutostart = this.processPage.getCommonData()?.autoStart ?? []
        ppAutostart = Array.isArray(ppAutostart) ? ppAutostart : [ppAutostart];
        return [...pAutostart, ...ppAutostart]
    }

    getProcessParameters(): { [p: string]: string } {
        return this.data?.common?.parameters ?? {}
    }

    getProcessPageParameters(): { [paramName: string]: string } {
        return this.processPage.getCommonData()?.parameters ?? {}
    }

    isProcess(): boolean {
        return true
    }

}