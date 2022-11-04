const queue: Array<any> = [];
const activePreFlushCallbacks: Array<any> = [];

let isFlushPnding = false;
const p = Promise.resolve();

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
};

export function queuePreFlushCb(job: Function) {
  activePreFlushCallbacks.push(job);
  queueFlush();
};

function queueFlush() {
  if (isFlushPnding) return;

  isFlushPnding = true;

  nextTick(flushJobs);
};

function flushJobs() {
  isFlushPnding = false;

  flushPreFlushCallbacks();

  // component render

  let job;
  while (job = queue.shift()) {
    job && job();
  }
};

export function nextTick(fn?) {
  return fn ? p.then(fn) : p;
};

function flushPreFlushCallbacks() {
  for (const activeCb of activePreFlushCallbacks) {
    activeCb();
  }
}
