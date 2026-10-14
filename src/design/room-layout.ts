// Width is measured inside the padded card, so padding must not be subtracted twice.
export function roomLayout(innerWidth: number, fontScale = 1) {
  const width = Math.max(0, innerWidth);
  const gap = 16;
  const legendMinimum = 190 * Math.max(1, fontScale);
  const horizontal = width >= 132 + gap + legendMinimum;
  const donut = horizontal ? Math.min(162, width - gap - legendMinimum) : Math.min(190, width * .62);
  return { horizontal, gap, donut, legend: horizontal ? width - donut - gap : width };
}
