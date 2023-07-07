import {Store} from "../store_wrapper";
import {InputTypeEnum, NodeType, ServiceTypeEnum} from "../const";
import {
    ActivityReferenceType,
    BasicActivityReferenceType,
    ProcessServiceActivityType,
    ProcessServiceSequenceType,
    ProcessServiceUIType,
    ProcessType,
    ServiceData
} from "../data_types/ProcessTypes";
// import {updateUI} from "../ui";
import {toArray} from "../util";
// import _ from "lodash";
import unzip from "lodash/unzip";
import map from "lodash/map";
import get from "lodash/get";
import zip from "lodash/zip";
import sortBy from "lodash/sortBy";

import Process from "./process_model";
import {Activity, ActivityError} from "./activity_models";
import {ServiceUIElements} from "./ui_element_models";
import {getToolkit} from "./tk_model";
import {UIInput} from "./parameter_models";
import {dynamicUIValidation} from "../validate_schemas";

export abstract class BaseService<T extends ProcessType | ServiceData> extends Store {

    //id: string
    name: string
    public readonly serviceType: ServiceTypeEnum
    title: string
    description: string
    data: T
    active: boolean
    activities: { [activityName: string]: Activity } = {}
    sequences: { [sequenceName: string]: Activity[] } = {}
    public UIElements: ServiceUIElements
    private currentlyRunningActivity: Activity | null = null
    node_id: string

    protected constructor(name: string, title: string, serviceType: ServiceTypeEnum, data: T) {
        super(name)
        this.name = name
        this.title = title
        this.serviceType = serviceType
        this.data = data
        this.node_id =getToolkit().register_node( this.name, this.title, NodeType.service)
    }

    /**
     * Create all activities of this service from the data
     */
    createActivities() {

        /**
         * Inner function to create the activity objects
         * @param activitiesMap the map of activities
         * @param parentActivity
         * @return [activities, activityOrder]
         */

        const [activities] = this.createFromActivitiesMap(this.getActivityData())
        this.activities = activities
    }

    createFromActivitiesMap(activitiesMap: {
        [activityName: string]: (ProcessServiceActivityType | ActivityReferenceType)
    }, parentActivity ?: Activity): [{ [activityName: string]: Activity }, string[]] {
        const activities: { [activityName: string]: Activity } = {}
        for (let [activityName, activityData] of Object.entries(activitiesMap || {})) {
            activities[activityName] = this.createActivity(activityName, activityData, parentActivity)
        }
        const [activityNames, activitiesData] = unzip(Object.entries(activitiesMap || {}))
        // get priorities (take inf as default)
        const activitiesPriorities = map(activitiesData, d => get(d, "priority", Number.POSITIVE_INFINITY))
        // zip props with names again, sort by prio and only take names
        // @ts-ignore
        const sortedActivities: string[] = map(sortBy(zip(activityNames, activitiesPriorities), [a => a[1]]), a => a[0])
        return [activities, sortedActivities]
    }

    createActivity(activityName: string, activityData: ProcessServiceActivityType | ActivityReferenceType, parentActivity ?: Activity) {
        const activity = new Activity(activityName, this, activityData, parentActivity)
        const [subActivities, activityOrder] = this.createFromActivitiesMap(activityData.subActivities || {}, activity)
        activity.subActivities = subActivities
        activity.subActivitiesOrder = activityOrder
        return activity
    }

    addActivity(activityName: string, activityData: ProcessServiceActivityType) {
        /**
         * This is not used anywhere, but it allows to dynamically add activities to a service
         */
        if (activityName in this.activities) {
            throw new Error(`Activity ${activityName} already exists`)
        }
        this.activities[activityName] = this.createActivity(activityName, activityData)
    }

    createSequences() {
        // get all activities and create sequences
        const sequences = this.getSequencesData()
        for (let [sequenceName, sequenceData] of Object.entries(sequences)) {
            this.sequences[sequenceName] = sequenceData.activities
                .map(activityName => this.getActivity({
                    activityName,
                    serviceName: this.name
                }))
        }
    }

    /**
     * Get all activities that are  inactive
     */
    getAllInactiveActivities(): Activity[] {
        const inactiveActivities = []
        for (let activity of Object.values(this.activities)) {
            inactiveActivities.push.apply(inactiveActivities, activity.getInactiveActivities())
        }
        return inactiveActivities
    }

    /**
     * Execute an activity of this service.
     * @param activityName
     */
    async executeActivity(activityName: string) {
        // console.debug("exec", activityName)
        if (this.currentlyRunningActivity) {
            return Promise.reject("Activity already running")
        }
        try {
            this.currentlyRunningActivity = this.activities[activityName]
            await this.activities[activityName].execute()
        } catch (e) {
            // alert is triggered by catch in the activity itself calling activityError
            getToolkit().activityFailed({
                title: this.activities[activityName].title,
                serviceName: this.name,
                activityName: this.activities[activityName].name
            })
            console.error(`Activity not executed: ${e}`)
            throw e
        } finally {
            this.activityFinished()
        }
    }

    registerRunningActivity(activity: Activity) {
        this.currentlyRunningActivity = activity
        this.getProcess().processPage.registerRunningActivity()
    }

    activityFinished() {
        // todo check this..
        // updateUI()
        this.currentlyRunningActivity = null
        getToolkit().activityStore.clearStore()
        this.getProcess().processPage.activityFinished()
    }

    async executeSequence(sequenceName: string) {
        if (this.currentlyRunningActivity) {
            return Promise.reject("Activity already running")
        }
        // go through all activities in the sequence and execute them
        for (let activity of this.sequences[sequenceName]) {
            try {
                this.currentlyRunningActivity = activity
                await activity.execute()
            } catch (e) {
                // alert is triggered by catch in the activity itself calling activityError
                console.error(`Activity not executed: ${e}`)
                throw e
            } finally {
                this.currentlyRunningActivity = null
            }
        }
        getToolkit().activityStore.clearStore()
    }

    /**
     * Execute autostart activities of this service. These activities are stores in the service root object under the key:
     * autostart and can be either just one string or an array of strings, which are the names of the activities to execute.
     */
    async autostart() {
        /**
         * execute the list of activities
         * @param autostartActivities array of strings of activity names
         */
        const runAutoStart = async (autostartActivities: string[]) => {
            for (let activityName of autostartActivities) {
                try {
                    await this.executeActivity(activityName)
                } catch (e) {
                    throw "autostart activity failed: " + e
                }
            }
        }

        // go through both, the process and the process-page data to check for autostart activities
        for (const autostartActivities of this.getAutostartActivities()) {
            await runAutoStart(toArray<string>(autostartActivities))
        }
    }

    /**
     * Preparation of Activities:
     * - map parameters
     */
    mapActivitiesParameters() {
        // console.log("prepare activities:", this.name, this.title)
        for (let activity of Object.values(this.activities)) {
            // console.log("BaseService.mapActivitiesParameters", this.name)
            activity.mapParameters(
                this.getProcessParameters(),
                this.getProcessPageParameters(),
                this.getUIInput())
        }
    }

    activityError(error: ActivityError) {
        alert(`Activity-error (service: ${error.service}):${error.activity} : ${error.message}`)
    }

    getUIInput(type?: InputTypeEnum): { [name: string]: UIInput } {
        return this.UIElements.getInputs(type)
    }

    registerDynamicUIElements(uiData: ProcessServiceUIType): ServiceUIElements {
        const valid = dynamicUIValidation(uiData)
        if (!valid) {
            throw Error("Invalid dynamic UI data")
        }
        const serviceUiElements = new ServiceUIElements(this, uiData)
        this.UIElements.merge(serviceUiElements)
        return serviceUiElements
    }

    abstract getActivity(activityReference: BasicActivityReferenceType): Activity

    abstract getActivityData(): { [activityName: string]: (ProcessServiceActivityType | ActivityReferenceType) }

    abstract getSequencesData(): { [sequenceName: string]: ProcessServiceSequenceType }

    abstract getAutostartActivities(): string[]

    abstract getProcess(): Process

    abstract getProcessParameters(): { [paramName: string]: string }

    abstract getProcessPageParameters(): { [paramName: string]: string }

    abstract isProcess(): boolean

}