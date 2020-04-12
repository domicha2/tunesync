/**
 * Give a URL extract the page value from the query params
 */
export function getPageFromURL(url: string): string | null {
  if (url === null) {
    return null;
  } else {
    const split = url.split('page=');
    if (split[1] === undefined) {
      // no page number is the equivalent to page 1
      return '1';
    } else {
      return split[1];
    }
  }
}
