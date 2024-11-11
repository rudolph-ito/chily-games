export function setSymmetricDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const difference = new Set<T>(setA);
  setB.forEach((elem) => {
    if (difference.has(elem)) {
      difference.delete(elem);
    } else {
      difference.add(elem);
    }
  });
  return difference;
}
