export enum StoreContextEnum {
    SERVICE = 'service',
    PROCESS = 'process',
    ACTIVITY = 'activit'
}

export class Store {

    private readonly storeName: string
    private store: object = {}

    constructor(storeName: string) {
        this.storeName = storeName
    }

    setStoreValue(valueName: string, value: any) {
        this.store[valueName] = value
    }

    getStoreValue(valueName: string): any {
        if (!(valueName in this.store)) {
            console.error(`Requesting cache variable that does not exist: ${valueName} in: ${this.storeName}`)
            return null
        }
        return this.store[valueName]
    }

    clearStore() {
        this.store = {}
    }
}
