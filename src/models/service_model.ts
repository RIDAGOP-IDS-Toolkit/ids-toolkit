import Process from "./process_model";
import {ServiceTypeEnum} from "../const";
import {Bridge} from "./bridge_models";
import {ProcessPageServiceType, ProcessPageServiceUiType} from "../data_types/process_page_types";
import {
    ActivityReferenceType,
    ProcessServiceActivityType,
    ProcessServiceSequenceType,
    ProcessServiceType, ServiceData
} from "../data_types/ProcessTypes";
import {BaseService} from "./base_service";
import {ServiceUIElements} from "./ui_element_models";
import {Activity} from "./activity_models";


/**
 * A service represents a service that can be used in a process
 */
export class Service extends BaseService<ServiceData> {

    name: string
    process: Process
    bridge: Bridge<any>

    // coming from the process
    constructor(serviceName,
                _process: Process,
                processServiceDescription: ProcessServiceType,
                processPageServiceDescription: ProcessPageServiceType,
                bridge: Bridge<any>) {
        super(serviceName, ServiceTypeEnum.service, {processServiceDescription, processPageServiceDescription})
        this.process = _process
        this.name = serviceName
        this.title = processPageServiceDescription.title || (processServiceDescription.title || "")
        this.UIElements = new ServiceUIElements(this, processServiceDescription.ui || {})

        this.data = {
            processServiceDescription,
            processPageServiceDescription
        }
        this.bridge = bridge
        this.bridge.setService(this)
    }

    getUiSettings(): ProcessPageServiceUiType {
        return this.data.processPageServiceDescription.ui
    }

    getAutostartActivities(): string[] {
        // return merge of this.data.processServiceDescription.autostart and this.data.processPageServiceDescription.autostart
        return [...(this.data.processServiceDescription.autostart || []), ...(this.data.processPageServiceDescription.autostart || [])]
    }

    getActivityData(): { [activityName: string]: (ProcessServiceActivityType | ActivityReferenceType) } {
        return this.data.processServiceDescription.activities
    }

    getSequencesData(): { [sequenceName: string]: ProcessServiceSequenceType } {
        return this.data.processServiceDescription.sequences || {}
    }

    getProcess(): Process {
        return this.process;
    }

    getProcessParameters(): { [paramName: string]: string } {
        return this.data.processServiceDescription.parameters || {}
    }

    getProcessPageParameters(): { [paramName: string]: string } {
        return this.data.processPageServiceDescription.parameters || {}
    }

    getActivity(activityReference: ActivityReferenceType): Activity {
        return this.activities[activityReference.activityName]
    }

    isProcess(): boolean {
        return false
    }
}

