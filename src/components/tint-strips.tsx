// ios safari 26 paints its status bar and toolbar from the fixed element it
// hit-tests just inside each edge. when that element is viewport-sized (a
// `fixed inset-0` page) webkit keeps whatever colour the edge already had, so
// a theme flip never reaches the bars. these two strips are ordinary
// candidates: their declared background-color wins each time it samples.
// they are masked to nothing; the sampler reads style, not pixels.
export default function TintStrips() {
  return (
    <>
      <div aria-hidden="true" className="tint-strip tint-strip-top" />
      <div aria-hidden="true" className="tint-strip tint-strip-bottom" />
    </>
  );
}
