"use client";

// The current time (to the minute), refreshed every minute so "today" stays
// right past midnight. While the page is being pre-built on the server there
// is no "now", so it is 0 there and the real time fills in in the browser.

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, MINUTE);
  return () => clearInterval(timer);
}

const getNow = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const getServerNow = () => 0;

export function useNow(): number {
  return useSyncExternalStore(subscribe, getNow, getServerNow);
}
