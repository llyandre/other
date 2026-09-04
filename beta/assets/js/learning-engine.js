export const REVIEW_INTERVALS=Object.freeze([1,3,7]);
export const DAY_MS=86400000;

export function masteryAccuracy(record={}){
  const seen=Math.max(0,Number(record.seen)||0);
  return seen?Math.round((Math.max(0,Number(record.correct)||0)/seen)*100):0;
}

export function masteryScore(record={}){
  const seen=Math.max(0,Number(record.seen)||0);
  if(!seen)return 0;
  const accuracy=Math.max(0,Number(record.correct)||0)/seen;
  const depth=Math.min(1,seen/3);
  return Math.round(accuracy*depth*100);
}

export function nextReviewLevel(previousLevel=0,correct=false){
  return correct?Math.min(3,Math.max(0,Number(previousLevel)||0)+1):0;
}

export function nextReviewDueAt(timestamp,level){
  const base=Number.isFinite(Number(timestamp))?Number(timestamp):Date.now();
  const interval=REVIEW_INTERVALS[Math.max(0,Number(level)-1)]||1;
  return base+interval*DAY_MS;
}

export function isMasteredRecord(record={}){
  return (Number(record.level)||0)>=3&&masteryAccuracy(record)>=80&&(Number(record.seen)||0)>=3;
}

export function isWeakRecord(record={}){
  return (Number(record.wrong)||0)>0&&(record.lastStatus==="wrong"||masteryAccuracy(record)<75||(Number(record.level)||0)<2);
}

export function weeklyProgress(total,target){
  const safeTarget=Math.max(1,Number(target)||1);
  return Math.min(100,Math.round((Math.max(0,Number(total)||0)/safeTarget)*100));
}
