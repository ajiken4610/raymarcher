export default (name, program) => {
  const projects = useCookie<{ [key: string]: string }>("projects", {
    default: () => ({}),
  });
  const data = {};
  data[name] = program;
  projects.value = { ...projects.value, ...data };
};
