export default {
    PROCESS_PAGE_SCHEMA_INVALID: "Process-Page schema is not valid:\n\n {error}",
    INACTIVE_ACTIVITIES: "Some activities are not active, because they have no active execution: (service:activity):\n\n {activities}",
    OTHER_ACTIVITY_REQUIRED: "You need to execute '{requiredActivity}' from the service '{serviceName}' before",
    CREATING_CAPABILITY_FAILED: "Creating capability failed: '{capabilityName}' for service-bridge: '{serviceName}' failed.\n\n{error}",
    OPENAPI_BRIDGE_CAPABILITY_MISSING: "Bridge capability (OpenApi): '{name}' does not have a corresponding operation:\n\n{error}",
    PROCESS_SERVICES_INVALID: "checkProcessServices failed: {error}",
    MODULE_LOAD_FAILED: "Could not load: {name}. uri: {moduleUri}, resolvedUri: {resolvedUri}",
    MODULE_FUNCTION_NOT_FOUND: "Module function not found: {functionName}",
    SUBACTIVITY_FAILED: "Sub-activity failed:\n{error}",
    OPENAPI_SPEC_NOT_VALID: "OpenApi spec is not valid for service:{serviceName}",
    OPENAPI_PATH_NOT_FOUND:"Cannot find openapi path for service-capability: {capabilityString}",
    OPENAPI_METHOD_NOT_FOUND:"Cannot find openapi method  for service-capability: {capabilityString} at path: {path}",
    OPENAPI_OPERATIONID_NOT_FOUND: "Cannot find openapi operationId for service-capability: {capabilityString}: operationId: {operationId}",
    AUTOSTART_WAS_NOT_EXECUTED: "Autostart was not executed, because some of the defined activities do not exist. {not_found}"
}