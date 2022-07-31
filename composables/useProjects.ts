export default () =>
  useCookie<{ [key: string]: string }>("projects", {
    default: () => ({}),
  });
