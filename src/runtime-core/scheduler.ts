const queue: Array<any> = [];
let isFlushPnding = false;
const p = Promise.resolve();

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
};

function queueFlush() {
  if (isFlushPnding) return;

  isFlushPnding = true;

  nextTick(flushJobs);
};

function flushJobs() {
  isFlushPnding = false;
    let job;
    while (job = queue.shift()) {
      job && job();
    }
};

export function nextTick(fn) {
  return fn ? p.then(fn) : p;
};
