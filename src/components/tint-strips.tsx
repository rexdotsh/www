// ios safari 26 tints its bars from the fixed element it hit-tests just inside
// each edge, and keeps the old colour when that element is viewport-sized (a
// `fixed inset-0` page). these strips are ordinary candidates whose declared
// background-color wins each time. masked to nothing: it reads style, not pixels
export default function TintStrips() {
  return (
    <>
      <div aria-hidden="true" className="tint-strip tint-strip-top" />
      <div aria-hidden="true" className="tint-strip tint-strip-bottom" />
    </>
  );
}
