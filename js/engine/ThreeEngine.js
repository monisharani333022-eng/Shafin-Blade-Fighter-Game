// Real-Time 3D WebGL Arena Engine (Three.js)
class ThreeEngine {
  constructor(containerId = 'game-container') {
    this.container = document.getElementById(containerId);

    // Create dedicated 3D WebGL Canvas
    this.canvas3D = document.createElement('canvas');
    this.canvas3D.id = 'three-canvas';
    this.canvas3D.style.position = 'absolute';
    this.canvas3D.style.top = '0';
    this.canvas3D.style.left = '0';
    this.canvas3D.style.width = '100%';
    this.canvas3D.style.height = '100%';
    this.canvas3D.style.zIndex = '1';
    this.canvas3D.style.display = 'block';
    this.container.insertBefore(this.canvas3D, this.container.firstChild);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas3D,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 3D Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06040a);
    this.scene.fog = new THREE.FogExp2(0x08060f, 0.015);

    // 3D Camera (45 deg FOV)
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 500);
    this.camera.position.set(0, 3.8, 11.5);
    this.cameraTarget = new THREE.Vector3(0, 2.2, 0);

    // Camera Shake & Cinematic parameters
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffset = new THREE.Vector3();
    this.cinematicMode = false;
    this.cinematicAngle = 0;

    this.initLights();
    this.initArena();
    this.initEmbers();

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  initLights() {
    // Ambient moody light
    const amb = new THREE.AmbientLight(0x221a33, 0.8);
    this.scene.add(amb);

    // Key Directional Light (Moonlight / Cyber spotlight casting shadows)
    this.dirLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    this.dirLight.position.set(5, 12, 8);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 30;
    this.dirLight.shadow.camera.left = -10;
    this.dirLight.shadow.camera.right = 10;
    this.dirLight.shadow.camera.top = 10;
    this.dirLight.shadow.camera.bottom = -2;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Rim light from back
    const rimLight = new THREE.DirectionalLight(0x3366cc, 0.9);
    rimLight.position.set(-6, 8, -6);
    this.scene.add(rimLight);

    // Golden point light for Shafin
    this.shafinLight = new THREE.PointLight(0xffd700, 1.8, 8);
    this.shafinLight.position.set(-3, 2, 0);
    this.scene.add(this.shafinLight);

    // Crimson point light for Nafis
    this.nafisLight = new THREE.PointLight(0xff2200, 2.0, 8);
    this.nafisLight.position.set(3, 2, 0);
    this.scene.add(this.nafisLight);
  }

  initArena() {
    // 1. 3D Rooftop Floor (Dark reflective tiles)
    const floorGeo = new THREE.PlaneGeometry(32, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x14121a,
      roughness: 0.25,
      metalness: 0.65
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Floor combat boundary lines (Glowing gold & red neon strips)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4 });
    const line1 = new THREE.Mesh(new THREE.PlaneGeometry(24, 0.08), lineMat);
    line1.rotation.x = -Math.PI / 2;
    line1.position.set(0, 0.01, -2.5);
    this.scene.add(line1);

    const line2 = new THREE.Mesh(new THREE.PlaneGeometry(24, 0.08), lineMat);
    line2.rotation.x = -Math.PI / 2;
    line2.position.set(0, 0.01, 2.5);
    this.scene.add(line2);

    // 2. 3D Stone Columns & Pillars on Stage
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x282432,
      roughness: 0.7,
      metalness: 0.2
    });

    const createPillar = (x, z, h) => {
      const geo = new THREE.CylinderGeometry(0.55, 0.65, h, 16);
      const mesh = new THREE.Mesh(geo, pillarMat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Capital / top
      const topGeo = new THREE.BoxGeometry(1.4, 0.35, 1.4);
      const topMesh = new THREE.Mesh(topGeo, pillarMat);
      topMesh.position.set(x, h + 0.17, z);
      topMesh.castShadow = true;
      this.scene.add(topMesh);
    };

    // Columns flanking the fighting stage
    createPillar(-8.5, -3.5, 6.0);
    createPillar(-10.5, -1.0, 7.5);
    createPillar(8.5, -3.5, 6.0);
    createPillar(10.5, -1.0, 7.5);

    // 3. 3D Cyber City Buildings in Background
    const buildMat = new THREE.MeshStandardMaterial({
      color: 0x0c0a14,
      roughness: 0.8,
      metalness: 0.3
    });

    for (let i = 0; i < 22; i++) {
      const bw = 2 + Math.random() * 3.5;
      const bh = 8 + Math.random() * 16;
      const bd = 2 + Math.random() * 3.5;
      const bGeo = new THREE.BoxGeometry(bw, bh, bd);
      const bMesh = new THREE.Mesh(bGeo, buildMat);
      const bx = (i - 11) * 3.2 + (Math.random() - 0.5) * 1.5;
      const bz = -12 - Math.random() * 18;
      bMesh.position.set(bx, bh / 2 - 2, bz);
      this.scene.add(bMesh);

      // Random glowing neon billboards
      if (Math.random() < 0.6) {
        const neonColor = Math.random() > 0.5 ? 0xff3366 : 0x00d2ff;
        const signMat = new THREE.MeshBasicMaterial({ color: neonColor });
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(bw * 0.7, 1.2), signMat);
        sign.position.set(bx, bh * 0.75, bz + bd / 2 + 0.05);
        this.scene.add(sign);
      }
    }
  }

  initEmbers() {
    // Floating 3D fiery embers drifting upwards
    const emberCount = 140;
    const emberGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    const speeds = new Float32Array(emberCount);

    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      speeds[i] = 0.8 + Math.random() * 1.2;
    }

    emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.emberSpeeds = speeds;

    const emberMat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.embers = new THREE.Points(emberGeo, emberMat);
    this.scene.add(this.embers);
  }

  shake(duration = 0.3, intensity = 0.35) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  update(dt, p1Mesh, p2Mesh) {
    // 1. Update 3D Floating Embers
    const pos = this.embers.geometry.attributes.position.array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3 + 1] += this.emberSpeeds[i] * dt;
      pos[i * 3] += Math.sin(pos[i * 3 + 1] * 2) * dt * 0.3;
      if (pos[i * 3 + 1] > 9) {
        pos[i * 3 + 1] = 0;
        pos[i * 3] = (Math.random() - 0.5) * 24;
      }
    }
    this.embers.geometry.attributes.position.needsUpdate = true;

    // 2. Camera Shake Decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    // 3. Dynamic 3D Camera Tracking
    if (p1Mesh && p2Mesh) {
      const midX = (p1Mesh.position.x + p2Mesh.position.x) / 2;
      const midY = (p1Mesh.position.y + p2Mesh.position.y) / 2 + 1.6;
      const dist = Math.abs(p1Mesh.position.x - p2Mesh.position.x);

      // Update point lights near fighters
      this.shafinLight.position.copy(p1Mesh.position).add(new THREE.Vector3(0, 1.8, 0.5));
      this.nafisLight.position.copy(p2Mesh.position).add(new THREE.Vector3(0, 1.8, 0.5));

      if (this.cinematicMode) {
        // Dramatic 3D orbiting camera angle during Super move
        this.cinematicAngle += dt * 3.5;
        const radius = 5.0;
        const camX = midX + Math.sin(this.cinematicAngle) * radius;
        const camZ = Math.cos(this.cinematicAngle) * radius;
        this.camera.position.set(camX, midY + 0.8, camZ).add(this.shakeOffset);
        this.camera.lookAt(midX, midY, 0);
      } else {
        // Regular 3D fighting tracking
        const targetCamX = midX * 0.7;
        const targetCamY = 3.2;
        // Dynamic Z depth based on distance between fighters
        const targetCamZ = Math.max(9.0, Math.min(15.0, 7.5 + dist * 0.6));

        this.camera.position.x += (targetCamX - this.camera.position.x) * 6 * dt;
        this.camera.position.y += (targetCamY - this.camera.position.y) * 6 * dt;
        this.camera.position.z += (targetCamZ - this.camera.position.z) * 5 * dt;

        this.camera.position.add(this.shakeOffset);

        this.cameraTarget.x += (midX - this.cameraTarget.x) * 6 * dt;
        this.cameraTarget.y = 1.8;
        this.camera.lookAt(this.cameraTarget);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  show3D() {
    this.canvas3D.style.display = 'block';
  }

  hide3D() {
    this.canvas3D.style.display = 'none';
  }
}

window.ThreeEngine = ThreeEngine;