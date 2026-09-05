// iOS Safari needs these masked strips to update its edge tint.
export default function TintStrips() {
  return (
    <>
      <div aria-hidden="true" className="tint-strip tint-strip-top" />
      <div aria-hidden="true" className="tint-strip tint-strip-bottom" />
    </>
  );
}
