// PVB — Michelle prueba mínima, sin eventos de click

let engine, scene, camera;

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("renderCanvas");

  engine = new BABYLON.Engine(canvas, true, { antialias: true });
  scene  = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  // Cámara — perspectiva de la foto
  camera = new BABYLON.ArcRotateCamera("cam", -2.45, 0.88, 18,
    BABYLON.Vector3.Zero(), scene);
  camera.fov  = 1.05;
  camera.minZ = 0.1;
  camera.attachControl(canvas, true);
  camera.wheelDeltaPercentage = 0.008;

  // Luz ambiental cálida
  const amb = new BABYLON.HemisphericLight("amb", new BABYLON.Vector3(0,1,0), scene);
  amb.intensity   = 1.0;
  amb.diffuse     = new BABYLON.Color3(1, 0.9, 0.7);
  amb.groundColor = new BABYLON.Color3(0.1, 0.08, 0.15);

  // Cargar Michelle
  BABYLON.SceneLoader.ImportMeshAsync("", "", "models/characters/michelle_idle.glb", scene)
    .then(result => {
      const root = result.meshes[0];
      root.position = BABYLON.Vector3.Zero();
      root.scaling  = new BABYLON.Vector3(0.011, 0.011, 0.011);

      // Detener animaciones que puedan mover el root
      result.animationGroups.forEach(ag => ag.stop());

      // Mostrar escena
      document.getElementById("loading").classList.add("hidden");
      console.log("Michelle OK, meshes:", result.meshes.length);
    })
    .catch(err => {
      console.error("Error:", err);
      // Fallback cápsula
      const cap = BABYLON.MeshBuilder.CreateCapsule("cap", { height: 1.75, radius: 0.22 }, scene);
      cap.position = new BABYLON.Vector3(0, 0.875, 0);
      const m = new BABYLON.StandardMaterial("m", scene);
      m.diffuseColor = new BABYLON.Color3(0.75, 0.27, 0.98);
      cap.material = m;
      document.getElementById("loading").classList.add("hidden");
    });

  engine.runRenderLoop(() => scene.render());
  window.addEventListener("resize", () => engine.resize());
});

window.closePanel  = () => {};
window.setCameraView = () => {};
