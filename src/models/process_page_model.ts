import {loadingAnimation, removeLoadingAnimation} from "../util";

import Process from "./process_model";
import {LoadsFiles} from "../resolver";
import {Bridge} from "./bridge_models";
import {
    ProcessPageCommonType,
    ProcessPageServiceType,
    ProcessPageType,
    ProcessPageViewType
} from "../data_types/process_page_types";
import {Activity} from "./activity_models";
import {InstanceTypeEnum, UIModeEnum} from "../const";


/**
 * The ProcessPage class represents the process-page.
 */
export default class ProcessPage {

    public readonly url: string
    public readonly title: string
    private processPageData: ProcessPageType
    private servicesBridges = {} // map serviceName -> Bridge
    public process: Process
    public view: ProcessPageViewType
    public local_prefix_path: string = ""

    constructor(url: string, processPageData: ProcessPageType) {
        this.url = url
        this.processPageData = processPageData
        this.title = processPageData.title
        this.local_prefix_path = processPageData.local_prefix_path
        this.view = processPageData.view ?? {type: UIModeEnum.build}
    }


    /**
     * Load services bridges, the process-page module and the process
     * @param validate if bridges and process-page module should be validated
     */
    async load(validate: boolean = true): Promise<void> {
        try {
            await this.loadServicesBridges(validate)
            const processPageModule = await LoadsFiles.importModule(
                this.processPageData.scriptUri,
                InstanceTypeEnum.moduleProcessPage,
                {type: InstanceTypeEnum.instanceProcessPage, path: "scriptUri"})

            this.process = await Process.loadProcess(this, this.processPageData.process, processPageModule, validate)
        } catch (e) {
            return Promise.reject(e)
        }
        await Promise.resolve()
    }

    /**
     * Load service bridges and the OpenApi definition (or client)
     * Add the bridges to the 'servicesBridges'
     * @param validate if bridges should be validated
     */
    async loadServicesBridges(validate: boolean = true) {
        const bridgePromises: Promise<object>[] = []
        // load bridges in parallel
        for (let [serviceName, service_description] of Object.entries(this.processPageData.services)) {
            if (service_description.bridge) {
                const promise = Bridge.loadBridge(
                    serviceName,
                    service_description.bridge,
                    LoadsFiles.getSourceLocationDefinition(
                        InstanceTypeEnum.instanceProcessPage,
                        InstanceTypeEnum.instanceBridge, serviceName),
                    validate
                )
                bridgePromises.push(promise)
                promise.then(bridge => {
                    this.servicesBridges[serviceName] = bridge
                }, error => {
                    return Promise.reject(error)
                })
            }
        }
        // await all bridges to be loaded
        await Promise.all(bridgePromises)
    }


    /**
     * Create activities and sequences for the process and all services
     */
    createServiceActivities() {
        [...Object.values(this.process.services), this.process].forEach(s => {
            s.createActivities()
            s.createSequences()
        })
    }

    /**
     * Get the names of all services
     */
    getServiceNames(): string[] {
        return Object.keys(this.processPageData.services)
    }

    /**
     * Get the  description of a service
     * @param serviceName name of the service
     */
    getServiceDescription(serviceName: string): ProcessPageServiceType {
        return this.processPageData.services[serviceName]
    }

    /**
     * Get the Bridge of a service
     * @param serviceName name of the service
     */
    getServicesBridge(serviceName: string): Bridge<any> {
        return this.servicesBridges[serviceName]
    }

    /**
     * Get all inactive activities of the process and all services
     */
    getAllInactiveActivities(): Activity[] {
        const inactiveActivities = []
        Object.values(this.process.services).forEach(s => {
            inactiveActivities.push.apply(inactiveActivities, s.getAllInactiveActivities())
        })
        inactiveActivities.push.apply(inactiveActivities, this.process.getAllInactiveActivities())
        return inactiveActivities
    }

    /**
     * Map the parameters of the activities of the process and all services
     */
    mapServiceActivitiesParameters() {
        // console.log("SERVICES", this.process.services)
        Object.values(this.process.services).forEach(s => s.mapActivitiesParameters())
        this.process.mapActivitiesParameters()
    }

    /**
     * Set the title of the page
     */
    setPageTitle() {
        let title: string | undefined
        if (this.title) {
            title = this.title
        } else if (this.process.title) {
            title = this.process.title
        }
        if (title) {
            window.document.title = title
        } else {
            console.warn("Neither the process-page nor the process define a title")
        }
    }

    /**
     * Run the autostart-activities of the process and all services
     */
    async autostart() {
        for (let service of Object.values(this.process.services)) {
            // console.log("AUTOSTART...", service.name, service.title)
            try {
                await service.autostart()
            } catch (e) {
                const errMsg = `autostart failed: ${e}, 'service': ${service.title}`
                console.error(errMsg)
                throw errMsg
            }
        }
    }

    /**
     * Get the common data of the process-page
     */
    getCommonData(): ProcessPageCommonType {
        return this.processPageData.common || {}
    }

    /**
     * Get the title of the process-page
     */
    getTitle(): string {
        return this.title
    }

    /**
     * Activate the loading animation when view-type is 'build'
     */
    registerRunningActivity() {
        if (this.view.type === UIModeEnum.build) {
            loadingAnimation()
        }
    }

    /**
     * Deactivate the loading animation when view-type is 'build'
     */
    activityFinished() {
        if (this.view.type === UIModeEnum.build) {
            removeLoadingAnimation()
        }
    }

}