"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var use_subscription_1 = require("use-subscription");
function useService(service) {
    var subscription = react_1.useMemo(function () { return ({
        getCurrentValue: function () { return service.state || service.initialState; },
        subscribe: function (callback) {
            var unsubscribe = service.subscribe(function (state) {
                if (state.changed !== false) {
                    callback();
                }
            }).unsubscribe;
            return unsubscribe;
        }
    }); }, [service]);
    var state = use_subscription_1.useSubscription(subscription);
    return [state, service.send, service];
}
exports.useService = useService;
