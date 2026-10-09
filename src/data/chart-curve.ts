export type ChartPoint = { x: number; y: number };
// Every Bézier control stays between its neighbouring samples. The curve's
// convex hull therefore cannot overshoot the samples or cross below zero.
export function boundedCurve(points: ChartPoint[]) {
  const segments = points.slice(1).map((end, i) => {
    const start = points[i];
    const before = points[Math.max(0, i - 1)];
    const after = points[Math.min(points.length - 1, i + 2)];
    const slope = (a: ChartPoint, b: ChartPoint) => (b.y - a.y) / Math.max(0.0001, b.x - a.x);
    const middle = slope(start, end);
    const tangent = (left: number, right: number) => left * right <= 0 ? 0 : 2 * left * right / (left + right);
    const delta = (end.x - start.x) / 3;
    const clamp = (value: number) => Math.max(Math.min(start.y, end.y), Math.min(Math.max(start.y, end.y), value));
    const c1 = { x: start.x + delta, y: clamp(start.y + tangent(slope(before, start), middle) * delta) };
    const c2 = { x: end.x - delta, y: clamp(end.y - tangent(middle, slope(end, after)) * delta) };
    return { start, c1, c2, end };
  });
  return { segments, path: points.length ? `M${points[0].x},${points[0].y}` + segments.map(({ c1, c2, end }) => ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`).join('') : '' };
}
