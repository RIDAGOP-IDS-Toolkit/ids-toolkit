import {
    anyDataInstanceType,
    DevSourceInstanceType,
    DevSourceType, anyInstanceType
} from "./data_types/generic";
import _ from "lodash"
export default class DevHelper {

    private sources: DevSourceType[] = []
    private instances: DevSourceInstanceType[] = []

    static addSource(source: DevSourceType) {
        // just in dev mode
        if (window.__DevHelper) {
            window.__DevHelper.sources.push(source)
        }
    }

    getSources(includeInstances: boolean = false) {
        if(includeInstances)
            return this.sources
        return this.sources.map(s => {
            const source_copy = _.cloneDeep(s)
            delete source_copy.instance;
            return source_copy
        })
    }

    static addInstance(instance: DevSourceInstanceType) {
        if (window.__DevHelper) {
            window.__DevHelper.instances.push(instance)
        }
    }

}
