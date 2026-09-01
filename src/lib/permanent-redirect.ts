export function permanentRedirect(destination: string) {
  return Response.redirect(destination, 308);
}
