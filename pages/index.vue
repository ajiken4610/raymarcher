<template lang="pug">
.container.my-4
  h1 All projects
  hr
  .d-flex.float-end
    .input-group.w-auto.ms-auto
      input.form-control(v-model="projectName" @keydown.enter="create" placeholder="Project name...")
      button.btn.btn-outline-primary(@click="create") New
  table.table.table-stripped(v-if="Object.keys(data).length" )
    thead
      tr
        td Project Name
        td 
    tbody
      tr.position-relative(v-for="(current,key) in data")
        td {{key}}
        td.d-flex
          .ms-auto.btn-group
            NuxtLink(:to="'/p/'+key").btn.btn-outline-primary Open
            button.btn.btn-outline-danger(@click="deleteProgram(key)") Delete
  h2(v-else) No Projects
</template>

<script setup lang="ts">
const data = useProjects();
const projectName = ref("");
const create = () => {
  if (projectName.value in data.value) {
    alert("Project name: " + projectName.value + "has already existed.");
  } else {
    useRouter().push("/p/" + projectName.value);
  }
};
const deleteProgram = (name) => {
  delete data.value[name];
  useProjects().value = data.value;
};
</script>
