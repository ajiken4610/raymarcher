<template lang="pug">
.container-fluid
  .row
    .col-12.g-0
      #container.mb-2(ref="container")
      .text-center
        button.btn.btn-primary(@click="toggle")
          template(v-if="running") STOP
          template(v-else) RUN
    .col-12.g-0
      FlexMonospaceEditor(v-model="data[name]" @update:model-value="save")
</template>

<script lang="ts">
const defaultProgram = `
uniform float u_Time;
uniform vec2 u_Resolution;

float lengthFunc(vec3 coord){
  return length(vec3(0.,0.,1.)-(mod(coord-u_Time*vec3(1.1,.7,.6),4.0)-2.0))-.5;
}

vec3 getNormal(vec3 coord){
  const float d = .001;
  return normalize(vec3(
        lengthFunc(coord+vec3(d,0.0,0.0))-lengthFunc(coord+vec3(-d,0.0,0.0)),
        lengthFunc(coord+vec3(0.0,d,0.0))-lengthFunc(coord+vec3(0.0,-d,0.0)),
        lengthFunc(coord+vec3(0.0,0.0,d))-lengthFunc(coord+vec3(0.0,0.0,-d))
    ));
}

void main(){
  vec2 uv = gl_FragCoord.xy/u_Resolution;
  const float fov = 3.14159265/6.;
  vec3 ray = normalize(vec3(sin(fov)*uv.x,sin(fov)*uv.y,cos(fov)));

  vec3 currentPos = vec3(0.,0.,0.);
  vec3 color = vec3(0.,0.,0.);
  for(float i = 0.;i < 256.;i++){
    float toObject = lengthFunc(currentPos);
    if(toObject < .01){
      color = vec3(max(0.,dot(getNormal(currentPos),normalize(vec3(1.,1.,-1.)))));
      break;
    }
    currentPos += ray * toObject;
  }

  gl_FragColor = vec4(color,1.);
}

`;
</script>

<script setup lang="ts">
import {
  Scene,
  WebGLRenderer,
  OrthographicCamera,
  PlaneBufferGeometry,
  Mesh,
  ShaderMaterial,
  Clock,
  Vector2,
} from "three";
const data = useProjects();
const name = useRoute().params.program.toString();
if (!data.value[name]) {
  saveProject(name, defaultProgram);
  data.value[name] = defaultProgram;
}
const container = ref<HTMLDivElement>();
const glObjects: { [key: string]: any } = new Proxy(
  {},
  {
    set(obj, prop, val) {
      if (prop in obj && typeof obj[prop].dispose === "function") {
        obj[prop].dispose();
      }
      obj[prop] = val;
      return true;
    },
    deleteProperty(obj, prop) {
      if (prop in obj) {
        delete obj[prop];
      }
      return true;
    },
  }
);
const finalize = () => {
  for (const key in glObjects) {
    if (typeof glObjects[key].dispose === "function") {
      glObjects[key].dispose();
    }
  }
};
const compileShader = () => {
  return (glObjects.material = new ShaderMaterial({
    vertexShader: `
      void main() {
	      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }`,
    fragmentShader: data.value[name],
    uniforms: {
      u_Time: { value: 0 },
      u_Resolution: { value: null },
    },
  }));
};
const running = ref(false);
const run = () => {
  const clock = new Clock();
  (glObjects.planeMesh as Mesh).material = compileShader();
  const render = () => {
    if (running.value) requestAnimationFrame(render);
    (glObjects.material as ShaderMaterial).uniforms.u_Time.value =
      clock.getElapsedTime();
    (glObjects.material as ShaderMaterial).uniforms.u_Resolution.value =
      new Vector2(container.value.clientWidth, container.value.clientWidth);
    (glObjects.renderer as WebGLRenderer).render(
      glObjects.scene,
      glObjects.camera
    );
  };
  render();
};
const toggle = () => {
  running.value = !running.value;
  if (running.value) {
    run();
  }
};
onMounted(() => {
  glObjects.scene = new Scene();
  glObjects.camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 2);
  glObjects.planeGeometory = new PlaneBufferGeometry(2, 2);
  glObjects.planeMesh = new Mesh(glObjects.planeGeometory, compileShader());
  glObjects.scene.add(glObjects.planeMesh);
  glObjects.camera.position.set(0, 0, 1);
  glObjects.renderer = new WebGLRenderer();
  glObjects.renderer.setSize(
    container.value.clientWidth,
    container.value.clientWidth
  );
  container.value.appendChild(glObjects.renderer.domElement);

  glObjects.renderer.setClearColor(0x000000);
});
onUnmounted(() => {
  finalize();
});
let id: number;
const save = () => {
  if (id) clearTimeout(id);
  id = window.setTimeout(() => {
    saveProject(name, data.value[name]);
  }, 1000);
};
</script>
