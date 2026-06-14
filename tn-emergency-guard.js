(function(){
  "use strict";

  window.__TN_EMERGENCY_STABILITY = true;
  window.__TN_BLOCKED_INTERVALS = 0;
  window.__TN_BLOCKED_TIMEOUTS = 0;

  const nativeSetInterval = window.setInterval.bind(window);
  const nativeSetTimeout = window.setTimeout.bind(window);
  const nativeAddEventListener = EventTarget.prototype.addEventListener;

  window.__tnNativeSetInterval = nativeSetInterval;
  window.__tnNativeSetTimeout = nativeSetTimeout;

  window.setInterval = function(callback, delay, ...args){
    const ms = Number(delay) || 0;
    const source = String(callback || "");
    const isRuntimeTimer = ms > 0 && ms < 900;
    const isExplicitlyAllowed = callback && callback.__tnAllowInterval === true;
    if(!isRuntimeTimer && !isExplicitlyAllowed){
      window.__TN_BLOCKED_INTERVALS += 1;
      return -window.__TN_BLOCKED_INTERVALS;
    }
    return nativeSetInterval(callback, delay, ...args);
  };

  window.setTimeout = function(callback, delay, ...args){
    const ms = Number(delay) || 0;
    const source = String(callback || "");
    const blocksAutoCloud = /CloudLoad|cloudLoad|CheckCloud|checkCloud|tn78CheckCloud|tn80CheckCloud/.test(source);
    if(blocksAutoCloud && ms >= 250 && ms <= 2500){
      window.__TN_BLOCKED_TIMEOUTS += 1;
      return -window.__TN_BLOCKED_TIMEOUTS;
    }
    return nativeSetTimeout(callback, delay, ...args);
  };

  EventTarget.prototype.addEventListener = function(type, callback, options){
    const source = String(callback || "");
    const isAutoSyncEvent = (type === "focus" || type === "visibilitychange" || type === "storage") &&
      /CloudLoad|cloudLoad|tn76RenderEverywhere|tn81RenderAll|tn82CloudLoad|tnFixCloudLoad/.test(source);
    if(isAutoSyncEvent){
      window.__TN_BLOCKED_TIMEOUTS += 1;
      return;
    }
    return nativeAddEventListener.call(this,type,callback,options);
  };
})();
