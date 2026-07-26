'use strict';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Milliseconds from `now` until the next `hour:minute` in local time (today
 * if that time hasn't passed yet, otherwise tomorrow). Pure function.
 * @param {number} hour 0-23
 * @param {number} minute 0-59
 * @param {Date} [now]
 * @returns {number}
 */
function msUntilNext(hour, minute, now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setTime(next.getTime() + ONE_DAY_MS);
  }
  return next.getTime() - now.getTime();
}

/**
 * Run `task` once a day at local `hour:minute`, forever, until the process
 * exits. Uses plain setTimeout re-armed after each run (no added
 * dependency) rather than a cron expression parser — this app only ever
 * needs "once a day at a fixed local time". A failing run is swallowed so
 * one bad day never cancels future runs; `task` is responsible for logging
 * its own errors.
 * @param {number} hour
 * @param {number} minute
 * @param {() => Promise<void>|void} task
 * @returns {{ cancel: () => void }} call `cancel()` to stop future runs
 */
function scheduleDaily(hour, minute, task) {
  let timer = null;
  let cancelled = false;

  function armNext() {
    if (cancelled) return;
    timer = setTimeout(async () => {
      try {
        await task();
      } catch (err) {
        // task() should log its own errors; never let one bad run stop
        // the schedule.
      }
      armNext();
    }, msUntilNext(hour, minute));
  }

  armNext();

  return {
    cancel() {
      cancelled = true;
      if (timer) clearTimeout(timer);
    },
  };
}

module.exports = { msUntilNext, scheduleDaily };
