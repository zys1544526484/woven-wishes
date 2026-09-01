export interface WeaveGesture {
  deltaX: number;
  deltaY: number;
  maxAbsDeltaY?: number;
  travel: number;
  trackHeight: number;
  direction: "ltr" | "rtl";
  cancelled?: boolean;
  multiPointer?: boolean;
}

export function isValidWeaveGesture(gesture: WeaveGesture): boolean {
  if (gesture.cancelled || gesture.multiPointer || gesture.travel <= 0) return false;
  const directionIsCorrect = gesture.direction === "ltr" ? gesture.deltaX > 0 : gesture.deltaX < 0;
  const verticalDrift = gesture.maxAbsDeltaY ?? Math.abs(gesture.deltaY);
  return directionIsCorrect
    && Math.abs(gesture.deltaX) >= gesture.travel * 0.7
    && verticalDrift <= gesture.trackHeight * 0.35;
}
