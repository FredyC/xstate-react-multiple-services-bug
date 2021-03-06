"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var xstate_1 = require("xstate");
var useConstant_1 = require("./useConstant");
var utils_1 = require("./utils");
var ReactEffectType;
(function (ReactEffectType) {
    ReactEffectType[ReactEffectType["Effect"] = 1] = "Effect";
    ReactEffectType[ReactEffectType["LayoutEffect"] = 2] = "LayoutEffect";
})(ReactEffectType || (ReactEffectType = {}));
function createReactActionFunction(exec, tag) {
    var effectExec = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // don't execute; just return
        return function () {
            return exec.apply(void 0, __spread(args));
        };
    };
    Object.defineProperties(effectExec, {
        name: { value: "effect:" + exec.name },
        __effect: { value: tag }
    });
    return effectExec;
}
function asEffect(exec) {
    return createReactActionFunction(exec, ReactEffectType.Effect);
}
exports.asEffect = asEffect;
function asLayoutEffect(exec) {
    return createReactActionFunction(exec, ReactEffectType.LayoutEffect);
}
exports.asLayoutEffect = asLayoutEffect;
function executeEffect(action, state) {
    var exec = action.exec;
    var originalExec = exec(state.context, state._event.data, {
        action: action,
        state: state,
        _event: state._event
    });
    originalExec();
}
function useMachine(machine, options) {
    if (options === void 0) { options = {}; }
    if (process.env.NODE_ENV !== 'production') {
        var _a = __read(react_1.useState(machine), 1), initialMachine = _a[0];
        if (machine !== initialMachine) {
            console.warn('Machine given to `useMachine` has changed between renders. This is not supported and might lead to unexpected results.\n' +
                'Please make sure that you pass the same Machine as argument each time.');
        }
    }
    var context = options.context, guards = options.guards, actions = options.actions, activities = options.activities, services = options.services, delays = options.delays, rehydratedState = options.state, interpreterOptions = __rest(options, ["context", "guards", "actions", "activities", "services", "delays", "state"]);
    var customMachine = useConstant_1.default(function () {
        var machineConfig = {
            context: context,
            guards: guards,
            actions: actions,
            activities: activities,
            services: services,
            delays: delays
        };
        return machine.withConfig(machineConfig, __assign(__assign({}, machine.context), context));
    });
    var service = useConstant_1.default(function () {
        return xstate_1.interpret(customMachine, interpreterOptions);
    });
    var _b = __read(react_1.useState(function () {
        return rehydratedState
            ? xstate_1.State.create(rehydratedState)
            : customMachine.initialState;
    }), 2), state = _b[0], setState = _b[1];
    var effectActionsRef = react_1.useRef([]);
    var layoutEffectActionsRef = react_1.useRef([]);
    react_1.useLayoutEffect(function () {
        service
            .onTransition(function (currentState) {
            var _a, _b;
            // Only change the current state if:
            // - the incoming state is not the initial state (since it's already set)
            // - AND the incoming state actually changed
            if (currentState.changed) {
                setState(currentState);
            }
            if (currentState.actions.length) {
                var reactEffectActions = currentState.actions.filter(function (action) {
                    return (typeof action.exec === 'function' &&
                        '__effect' in
                            action.exec);
                });
                var _c = __read(utils_1.partition(reactEffectActions, function (action) {
                    return action.exec.__effect === ReactEffectType.Effect;
                }), 2), effectActions = _c[0], layoutEffectActions = _c[1];
                (_a = effectActionsRef.current).push.apply(_a, __spread(effectActions.map(function (effectAction) { return [effectAction, currentState]; })));
                (_b = layoutEffectActionsRef.current).push.apply(_b, __spread(layoutEffectActions.map(function (layoutEffectAction) { return [layoutEffectAction, currentState]; })));
            }
        })
            .start(rehydratedState ? xstate_1.State.create(rehydratedState) : undefined);
        return function () {
            service.stop();
        };
    }, []);
    // Make sure actions and services are kept updated when they change.
    // This mutation assignment is safe because the service instance is only used
    // in one place -- this hook's caller.
    react_1.useEffect(function () {
        Object.assign(service.machine.options.actions, actions);
    }, [actions]);
    react_1.useEffect(function () {
        Object.assign(service.machine.options.services, services);
    }, [services]);
    react_1.useLayoutEffect(function () {
        while (layoutEffectActionsRef.current.length) {
            var _a = __read(layoutEffectActionsRef.current.shift(), 2), layoutEffectAction = _a[0], effectState = _a[1];
            executeEffect(layoutEffectAction, effectState);
        }
    }, [state]); // https://github.com/davidkpiano/xstate/pull/1202#discussion_r429677773
    react_1.useEffect(function () {
        while (effectActionsRef.current.length) {
            var _a = __read(effectActionsRef.current.shift(), 2), effectAction = _a[0], effectState = _a[1];
            executeEffect(effectAction, effectState);
        }
    }, [state]);
    return [state, service.send, service];
}
exports.useMachine = useMachine;
