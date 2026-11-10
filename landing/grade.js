export const GRADES = ['not weighed', 'quick', 'argued', 'educated'];

export function guessGrade(why) {
  return /^only the part "|is not a number word/.test(why || '') ? 'argued' : 'not weighed';
}
