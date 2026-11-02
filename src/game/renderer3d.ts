import * as THREE from 'three';
import { CAR_SKINS } from './renderer';
import {
  CarSkin,
  FloatingText,
  Particle,
  Pickup,
  RemoteRacer,
  RoadsideObject,
  SkidMark,
  TimeOfDay,
  Vehicle,
  TRACKS,
  TrackConfig,
} from './types';
import { CustomCarStyle } from '../services/progress';

const ROAD_WIDTH = 12;
const PIXEL_TO_WORLD = 0.12;
export const JUNCTION_SPACING = 560;
const TRACK_SAMPLES = 120;
const TRACK_LENGTH = 240;

interface RouteTurn {
  distance: number;
  direction: -1 | 0 | 1;
}

export class GameRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(54, 1, 0.1, 500);
  private readonly roadBounds = { x: 0, width: 420, laneWidth: 105, leftKerb: 0, rightKerb: 420 };
  private readonly world = new THREE.Group();
  private readonly vehicles = new Map<number, THREE.Group>();
  private readonly rivalVehicles = new Map<string, THREE.Group>();
  private readonly rivalLabels = new Map<string, THREE.Sprite>();
  private readonly pickups = new Map<number, THREE.Group>();
  private readonly scenery = new Map<number, THREE.Group>();
  private readonly pickupLabels = new Map<number, THREE.Sprite>();
  private readonly floatingLabels = new Map<number, THREE.Sprite>();
  private readonly activeVehicleIds = new Set<number>();
  private readonly routeTurns: RouteTurn[] = [];
  private readonly laneMarkers: THREE.Mesh[] = [];
  private readonly kerbs: THREE.Mesh[] = [];
  private readonly particles: THREE.Mesh[] = [];
  private readonly skidMeshes: THREE.Mesh[] = [];
  private readonly roadGeometry = this.createRibbonGeometry(TRACK_SAMPLES);
  private readonly shoulderGeometries = [
    this.createRibbonGeometry(TRACK_SAMPLES),
    this.createRibbonGeometry(TRACK_SAMPLES),
  ];
  private readonly forkGeometries = [
    this.createRibbonGeometry(50),
    this.createRibbonGeometry(50),
  ];
  private readonly road = new THREE.Mesh(this.roadGeometry, this.material('#263244', 0.15, 0.82));
  private readonly shoulders = this.shoulderGeometries.map(
    (geometry) => new THREE.Mesh(geometry, this.material('#6b7280', 0.18, 0.8))
  );
  private readonly forks = this.forkGeometries.map(
    (geometry) => new THREE.Mesh(geometry, this.material('#343c4b', 0.08, 0.9))
  );
  private readonly particleMaterial = new THREE.MeshBasicMaterial({
    color: '#fbbf24',
    transparent: true,
    opacity: 0.8,
  });
  private readonly pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  private width = 800;
  private height = 900;
  private roadX = 0;
  private roadWidth = 420;
  private currentProgress = 0;
  private currentPlayerX = 0;
  private playerY = 720;
  private timeOfDay: TimeOfDay = 'day';
  private cameraShake = 0;
  private reducedMotion = false;
  private junctionDistance = 0;
  private currentSpeedMph = 0;
  private smoothCameraX = 0;
  private smoothLookAtX = 0;
  private currentTrack: TrackConfig = TRACKS[0];
  private readonly ground: THREE.Mesh;
  private readonly skyLight: THREE.HemisphereLight;
  private readonly sunLight: THREE.DirectionalLight;
  private playerModel: THREE.Group;
  private playerChassisGroup: THREE.Group;
  private playerFrontWheels: THREE.Group[] = [];
  private playerShadow: THREE.Mesh;
  private readonly shield: THREE.Mesh;
  private readonly exhaust: THREE.Mesh;
  private readonly underglowMesh: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene.add(this.world);

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      this.material('#164a36', 0, 1)
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.22;
    this.ground.receiveShadow = true;
    this.world.add(this.ground);

    this.skyLight = new THREE.HemisphereLight('#dbeafe', '#31503c', 2.05);
    this.world.add(this.skyLight);
    this.sunLight = new THREE.DirectionalLight('#fff1cf', 3.1);
    this.sunLight.position.set(-18, 30, 8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.bias = -0.0002;
    this.world.add(this.sunLight);

    this.road.receiveShadow = true;
    this.shoulders.forEach((shoulder) => {
      shoulder.receiveShadow = true;
    });
    this.world.add(this.road, ...this.shoulders, ...this.forks);

    this.createRoadDetails();

    // Player Model Group
    this.playerModel = new THREE.Group();
    this.playerChassisGroup = new THREE.Group();
    this.playerModel.add(this.playerChassisGroup);

    this.rebuildPlayerCar(CAR_SKINS[0]);

    this.playerShadow = this.createShadow(2.5, 4.3);
    this.playerShadow.position.y = -0.12;
    this.playerModel.add(this.playerShadow);

    // Neon underglow
    const underglowGeo = new THREE.PlaneGeometry(2.4, 4.2);
    const underglowMat = new THREE.MeshBasicMaterial({
      color: '#e11d48',
      transparent: true,
      opacity: 0.45,
    });
    this.underglowMesh = new THREE.Mesh(underglowGeo, underglowMat);
    this.underglowMesh.rotation.x = -Math.PI / 2;
    this.underglowMesh.position.y = 0.05;
    this.playerModel.add(this.underglowMesh);

    this.shield = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 24, 16),
      new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0284c7',
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.22,
        roughness: 0.15,
        metalness: 0.25,
      })
    );
    this.shield.position.y = 1.3;
    this.shield.visible = false;
    this.playerModel.add(this.shield);

    this.exhaust = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 2.2, 8),
      new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0.85 })
    );
    this.exhaust.rotation.x = -Math.PI / 2;
    this.exhaust.position.set(0, 0.45, 2.2);
    this.exhaust.visible = false;
    this.playerModel.add(this.exhaust);

    this.world.add(this.playerModel);
    this.resize();
  }

  public setDimensions(width: number, height: number, roadWidth = 420) {
    this.width = width;
    this.height = height;
    this.roadWidth = Math.min(roadWidth, width * 0.88);
    this.roadX = (width - this.roadWidth) / 2;
    this.roadBounds.width = this.roadWidth;
    this.roadBounds.x = this.roadX;
    this.roadBounds.laneWidth = this.roadWidth / 4;
    this.roadBounds.leftKerb = this.roadX;
    this.roadBounds.rightKerb = this.roadX + this.roadWidth;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public getRoadBounds() {
    return { ...this.roadBounds };
  }

  public setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
  }

  public addCameraShake(amount: number) {
    this.cameraShake = Math.min(1.4, this.cameraShake + amount);
  }

  public addRouteTurn(direction: -1 | 0 | 1, distance: number) {
    if (direction === 0) return;
    this.routeTurns.push({ direction, distance });
    if (this.routeTurns.length > 20) this.routeTurns.shift();
  }

  public resetRoutes() {
    this.routeTurns.length = 0;
  }

  public setTrack(track: TrackConfig) {
    this.currentTrack = track;
    if (this.road.material instanceof THREE.MeshStandardMaterial) {
      this.road.material.color.set(track.roadColor);
    }
    this.shoulders.forEach((shoulder) => {
      if (shoulder.material instanceof THREE.MeshStandardMaterial) {
        shoulder.material.color.set(track.shoulderColor);
      }
    });
    if (this.ground.material instanceof THREE.MeshStandardMaterial) {
      this.ground.material.color.set(track.groundColor);
    }
    this.updateLighting(track.timeOfDay);
  }

  public getTrackCurveAhead(): number {
    const aheadProgress = this.currentProgress + 80;
    const currentCenter = this.trackCenterAt(this.currentProgress);
    const aheadCenter = this.trackCenterAt(aheadProgress);
    return Math.max(-1, Math.min(1, (aheadCenter - currentCenter) / 12));
  }

  public rebuildPlayerCar(skin: CarSkin, style?: CustomCarStyle) {
    // Clear previous chassis elements
    while (this.playerChassisGroup.children.length > 0) {
      const child = this.playerChassisGroup.children[0];
      this.playerChassisGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
      }
    }
    this.playerFrontWheels = [];

    const primary = style?.primaryColor || skin.primary;
    const secondary = style?.secondaryColor || skin.secondary;
    const accent = style?.accentColor || skin.accent;
    const finish = style?.finish || 'gloss';
    const spoiler = style?.spoilerStyle || 'gt_wing';
    const wheel = style?.wheelStyle || 'tuner5';
    const decalPreset = style?.decalPreset || 'none';
    const customDecalUrl = style?.customDecalUrl;

    const built = this.createCarModel(
      primary,
      secondary,
      accent,
      1,
      1,
      skin.bodyStyle,
      true,
      finish,
      spoiler,
      wheel,
      decalPreset,
      customDecalUrl
    );

    this.playerChassisGroup.add(built.group);
    this.playerFrontWheels = built.frontWheels;

    if (this.underglowMesh && this.underglowMesh.material instanceof THREE.MeshBasicMaterial) {
      const underglowColor = style?.underglowColor || primary;
      this.underglowMesh.material.color.set(underglowColor);
      this.underglowMesh.visible = style?.underglowEnabled !== false;
    }
  }

  public renderEnvironment(
    roadOffset: number,
    timeOfDay: TimeOfDay,
    roadsideObjects: RoadsideObject[],
    skidMarks: SkidMark[],
    junctionDistance = 0
  ) {
    this.currentProgress = roadOffset * PIXEL_TO_WORLD;
    this.timeOfDay = timeOfDay;
    this.junctionDistance = junctionDistance;
    this.updateLighting(timeOfDay);
    this.updateTrack();
    this.updateJunctionForks();
    this.updateLaneMarkers();
    this.updateKerbs();
    this.updateRoadsideObjects(roadsideObjects);
    this.updateSkidMarks(skidMarks);
  }

  public renderPlayerCar(
    player: Vehicle,
    skin: CarSkin,
    isBoosting: boolean,
    isBraking: boolean,
    _timeOfDay: TimeOfDay,
    shieldActive = false,
    speedBoostActive = false,
    bodyRoll = 0,
    pitchAngle = 0,
    counterSteerAngle = 0
  ) {
    this.currentSpeedMph = player.speed;
    const position = this.toWorldPosition(player.x, player.y);
    this.currentPlayerX = position.x;
    this.playerY = player.y;

    this.playerModel.position.set(position.x, 0, position.z);
    this.playerModel.rotation.y = -player.angle;

    // Apply suspension dynamics to chassis
    this.playerChassisGroup.rotation.z = bodyRoll; // Roll into/away from drift
    this.playerChassisGroup.rotation.x = pitchAngle; // Squat on acceleration, dive on braking

    // Steer front wheels
    for (const fw of this.playerFrontWheels) {
      fw.rotation.y = counterSteerAngle;
    }

    this.shield.visible = shieldActive;
    this.exhaust.visible = isBoosting || speedBoostActive;
    const exhaustMaterial = this.exhaust.material as THREE.MeshBasicMaterial;
    exhaustMaterial.color.set(speedBoostActive ? '#fbbf24' : '#22d3ee');
    exhaustMaterial.opacity = 0.75 + Math.sin(performance.now() * 0.035) * 0.25;
    this.exhaust.scale.setScalar(speedBoostActive ? 1.5 : 1);
  }

  public renderEnemy(enemy: Vehicle) {
    this.activeVehicleIds.add(enemy.id);
    let model = this.vehicles.get(enemy.id);
    if (!model) {
      const palette =
        enemy.type === 'police'
          ? { primary: '#0f172a', secondary: '#ffffff', accent: '#38bdf8' }
          : enemy.type === 'taxi'
            ? { primary: '#eab308', secondary: '#1e293b', accent: '#ffffff' }
            : enemy.type === 'truck'
              ? { primary: '#475569', secondary: '#1e293b', accent: '#f97316' }
              : { primary: enemy.color, secondary: enemy.secondaryColor || '#0f172a', accent: '#ffffff' };

      const bodyStyle = enemy.type === 'police' ? 'police' : enemy.type === 'truck' ? 'muscle' : 'sports';
      const built = this.createCarModel(
        palette.primary,
        palette.secondary,
        palette.accent,
        enemy.width / 44,
        enemy.height / 82,
        bodyStyle
      );
      model = built.group;
      model.traverse((node) => {
        if (node instanceof THREE.Mesh) node.castShadow = true;
      });
      this.world.add(model);
      this.vehicles.set(enemy.id, model);
    }

    const position = this.toWorldPosition(enemy.x, enemy.y);
    const isTipped = Boolean(enemy.isBlasted);
    model.position.set(position.x, isTipped ? 0.45 : 0, position.z);
    model.rotation.y = -enemy.angle + (isTipped ? (enemy.blastVx ? Math.sign(enemy.blastVx) * 0.28 : 0) : 0);
    model.rotation.z = enemy.blastRot ?? 0;
    model.rotation.x = isTipped ? 0.08 : 0;
    model.visible = Math.abs(position.z) < 225;
  }

  public renderRivals(rivals: RemoteRacer[], playerDistance: number) {
    const activeRivalIds = new Set<string>();

    for (const rival of rivals) {
      activeRivalIds.add(rival.id);
      let model = this.rivalVehicles.get(rival.id);
      let label = this.rivalLabels.get(rival.id);

      if (!model) {
        const skinMatch = CAR_SKINS.find((s) => s.id === rival.carId) || CAR_SKINS[0];
        const built = this.createCarModel(
          rival.color || skinMatch.primary,
          rival.secondaryColor || skinMatch.secondary,
          skinMatch.accent,
          1,
          1,
          skinMatch.bodyStyle
        );
        model = built.group;
        this.world.add(model);
        this.rivalVehicles.set(rival.id, model);

        label = this.createRivalTagSprite(rival.name);
        this.world.add(label);
        this.rivalLabels.set(rival.id, label);
      }

      // Calculate relative position along highway track
      const deltaMeters = rival.distance - playerDistance;
      // Convert meter delta to world z offset (1m ~ 2.15 world z units)
      const relativeZ = -deltaMeters * 2.15;
      const lateral = ((rival.x - this.roadX) / this.roadWidth - 0.5) * ROAD_WIDTH;
      const pathOffset = this.trackCenterAt(this.currentProgress - relativeZ) - this.trackCenterAt(this.currentProgress);

      const worldX = lateral + pathOffset;
      model.position.set(worldX, 0, relativeZ);
      model.rotation.y = -rival.angle;
      model.visible = Math.abs(relativeZ) < 220;

      if (label) {
        label.position.set(worldX, 2.5, relativeZ);
        label.visible = model.visible;
      }
    }

    // Cleanup absent rivals
    for (const [id, group] of this.rivalVehicles.entries()) {
      if (!activeRivalIds.has(id)) {
        this.world.remove(group);
        this.rivalVehicles.delete(id);
      }
    }
    for (const [id, label] of this.rivalLabels.entries()) {
      if (!activeRivalIds.has(id)) {
        this.world.remove(label);
        label.material.dispose();
        label.material.map?.dispose();
        this.rivalLabels.delete(id);
      }
    }
  }

  public renderPickups(pickups: Pickup[], showLabels = false) {
    const activeIds = new Set<number>();
    for (const pickup of pickups) {
      if (pickup.collected) continue;
      activeIds.add(pickup.id);
      let group = this.pickups.get(pickup.id);
      if (!group) {
        group = this.createPickup(pickup.type);
        this.world.add(group);
        this.pickups.set(pickup.id, group);
      }

      const position = this.toWorldPosition(pickup.x, pickup.y);
      group.position.set(position.x, 1.05, position.z);
      group.rotation.y = this.reducedMotion ? 0 : pickup.bobTimer * 1.5;
      group.position.y = 1.05 + (this.reducedMotion ? 0 : Math.sin(pickup.bobTimer * 4) * 0.18);
      group.visible = Math.abs(position.z) < 225;
      this.updatePickupLabel(pickup.id, pickup.type, showLabels, position);
    }
    this.removeInactive(this.pickups, activeIds);
    if (showLabels) {
      this.removeInactive(this.pickupLabels, activeIds);
    } else {
      for (const [id, label] of this.pickupLabels) {
        this.world.remove(label);
        label.material.dispose();
        label.material.map?.dispose();
        this.pickupLabels.delete(id);
      }
    }
  }

  public renderParticles(particles: Particle[]) {
    for (let i = 0; i < this.particles.length; i++) this.particles[i].visible = false;
    particles.slice(0, 110).forEach((particle, index) => {
      let mesh = this.particles[index];
      if (!mesh) {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), this.particleMaterial);
        this.world.add(mesh);
        this.particles.push(mesh);
      }
      const position = this.toWorldPosition(particle.x, particle.y);
      mesh.position.set(position.x, particle.type === 'debris' ? 0.35 : 0.16, position.z);
      mesh.scale.setScalar(Math.max(0.06, particle.size * 0.028));
      mesh.visible = particle.life > 0 && Math.abs(position.z) < 220;
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.opacity = Math.max(0.1, particle.alpha);
        mesh.material.color.set(particle.color.startsWith('#') ? particle.color : '#fbbf24');
      }
    });
  }

  public renderFloatingTexts(texts: FloatingText[]) {
    for (const [index, item] of texts.entries()) {
      let sprite = this.floatingLabels.get(item.id);
      if (!sprite) {
        sprite = this.createTextSprite(item.text, item.color);
        this.world.add(sprite);
        this.floatingLabels.set(item.id, sprite);
      }
      const position = this.toWorldPosition(item.x, item.y);
      sprite.position.set(position.x, 3.6 + index * 0.35, position.z);
      sprite.material.opacity = Math.max(0, item.life / item.maxLife);
      sprite.visible = Math.abs(position.z) < 220;
    }

    const activeTextIds = new Set(texts.map((item) => item.id));
    for (const [id, sprite] of this.floatingLabels) {
      if (!activeTextIds.has(id)) {
        this.world.remove(sprite);
        sprite.material.dispose();
        sprite.material.map?.dispose();
        this.floatingLabels.delete(id);
      }
    }

    this.removeInactive(this.vehicles, this.activeVehicleIds);
    this.activeVehicleIds.clear();
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Sprite) {
        object.material.map?.dispose();
        object.material.dispose();
      } else if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.renderer.dispose();
  }

  private resize() {
    this.setDimensions(this.width, this.height, this.roadWidth);
  }

  private createRoadDetails() {
    const laneMaterial = new THREE.MeshStandardMaterial({
      color: '#d9e3ed',
      emissive: '#64748b',
      emissiveIntensity: 0.18,
      roughness: 0.85,
    });
    for (let i = 0; i < 36; i++) {
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 5.5), laneMaterial);
      marker.receiveShadow = true;
      this.world.add(marker);
      this.laneMarkers.push(marker);
    }

    for (let i = 0; i < 28; i++) {
      const kerb = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.09, 8),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? '#e43b46' : '#f8fafc',
          roughness: 0.8,
        })
      );
      kerb.position.y = 0.045;
      kerb.receiveShadow = true;
      this.world.add(kerb);
      this.kerbs.push(kerb);
    }
  }

  private createRibbonGeometry(samples: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(samples * 2 * 3);
    const indices: number[] = [];
    for (let i = 0; i < samples - 1; i++) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    return geometry;
  }

  private updateTrack() {
    const position = this.roadGeometry.attributes.position as THREE.BufferAttribute;
    const centerNow = this.trackCenterAt(this.currentProgress);

    for (let i = 0; i < TRACK_SAMPLES; i++) {
      const z = -i * (TRACK_LENGTH / (TRACK_SAMPLES - 1));
      const progress = this.currentProgress - z;
      const center = this.trackCenterAt(progress) - centerNow;
      position.setXYZ(i * 2, center - ROAD_WIDTH / 2, 0, z);
      position.setXYZ(i * 2 + 1, center + ROAD_WIDTH / 2, 0, z);
    }
    position.needsUpdate = true;
    this.roadGeometry.computeVertexNormals();

    const shoulderWidth = 4.2;
    this.shoulderGeometries.forEach((geometry, side) => {
      const attr = geometry.attributes.position as THREE.BufferAttribute;
      const direction = side === 0 ? -1 : 1;
      for (let i = 0; i < TRACK_SAMPLES; i++) {
        const z = -i * (TRACK_LENGTH / (TRACK_SAMPLES - 1));
        const progress = this.currentProgress - z;
        const center = this.trackCenterAt(progress) - centerNow;
        const edge = center + direction * (ROAD_WIDTH / 2);
        attr.setXYZ(i * 2, edge, 0, z);
        attr.setXYZ(i * 2 + 1, edge + direction * shoulderWidth, 0, z);
      }
      attr.needsUpdate = true;
      geometry.computeVertexNormals();
    });
  }

  private updateJunctionForks() {
    const currentJunction = Math.floor(this.currentProgress / JUNCTION_SPACING) * JUNCTION_SPACING;
    const nextJunction = currentJunction + JUNCTION_SPACING;
    const distanceToNext = nextJunction - this.currentProgress;
    const centerNow = this.trackCenterAt(this.currentProgress);

    this.forkGeometries.forEach((geometry, side) => {
      const position = geometry.attributes.position as THREE.BufferAttribute;
      const direction = side === 0 ? -1 : 1;
      const samples = 50;

      for (let i = 0; i < samples; i++) {
        const z = -distanceToNext - i * 2.8;
        const progress = this.currentProgress - z;
        const center = this.trackCenterAt(progress) - centerNow;
        const distance = Math.max(0, -z - distanceToNext);
        const spread = 2.6 + distance * 0.19;
        const branchCenter = center + direction * spread;
        position.setXYZ(i * 2, branchCenter - 3.5, 0.015, z);
        position.setXYZ(i * 2 + 1, branchCenter + 3.5, 0.015, z);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
    });
  }

  private updateLaneMarkers() {
    let markerIndex = 0;
    const centerNow = this.trackCenterAt(this.currentProgress);
    for (let dash = 0; dash < 12; dash++) {
      const z = -7 - dash * 16;
      const pathOffset = this.trackCenterAt(this.currentProgress - z) - centerNow;
      for (let lane = 1; lane < 4; lane++) {
        const marker = this.laneMarkers[markerIndex++];
        marker.position.set(pathOffset + (lane - 2) * 3, 0.025, z);
        marker.visible = z > -TRACK_LENGTH;
      }
    }
  }

  private updateKerbs() {
    const centerNow = this.trackCenterAt(this.currentProgress);
    for (let i = 0; i < 14; i++) {
      const z = -4 - i * 16;
      const pathOffset = this.trackCenterAt(this.currentProgress - z) - centerNow;
      for (let side = 0; side < 2; side++) {
        const kerb = this.kerbs[i * 2 + side];
        const direction = side === 0 ? -1 : 1;
        kerb.position.x = pathOffset + direction * (ROAD_WIDTH / 2 - 0.22);
        kerb.position.z = z;
      }
    }
  }

  private updateRoadsideObjects(objects: RoadsideObject[]) {
    const active = new Set<number>();
    for (const object of objects) {
      active.add(object.id);
      let group = this.scenery.get(object.id);
      if (!group) {
        group = this.createSceneryObject(object.type);
        this.world.add(group);
        this.scenery.set(object.id, group);
      }
      const z = (object.y - this.playerY) * PIXEL_TO_WORLD;
      const progress = this.currentProgress - z;
      const curveOffset = this.trackCenterAt(progress) - this.trackCenterAt(this.currentProgress);
      const side = object.side === 'left' ? -1 : 1;
      group.position.set(curveOffset + side * (ROAD_WIDTH / 2 + 5.3), 0, z);
      group.visible = Math.abs(z) < TRACK_LENGTH;
    }
    this.removeInactive(this.scenery, active);
  }

  private updateSkidMarks(marks: SkidMark[]) {
    while (this.skidMeshes.length < marks.length) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.44, 2.2),
        new THREE.MeshBasicMaterial({ color: '#111827', transparent: true, opacity: 0.38 })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.035;
      this.world.add(mesh);
      this.skidMeshes.push(mesh);
    }
    this.skidMeshes.forEach((mesh, index) => {
      const mark = marks[index];
      if (!mark) {
        mesh.visible = false;
        return;
      }
      const position = this.toWorldPosition(mark.x, mark.y);
      mesh.position.set(position.x, 0.035, position.z);
      mesh.visible = Math.abs(position.z) < 100;
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.opacity = mark.alpha * 0.42;
        if (mark.color) {
          mesh.material.color.set(mark.color);
        } else {
          mesh.material.color.set('#0f172a');
        }
      }
    });
  }

  private updateLighting(timeOfDay: TimeOfDay) {
    const palettes = {
      day: { sky: '#8ac8ef', fog: '#9dc7d7', hemi: '#dbeafe', ground: '#315b3b', intensity: 3.1 },
      sunset: { sky: '#8d5360', fog: '#8a6671', hemi: '#ffc28f', ground: '#44323b', intensity: 2.1 },
      night: { sky: '#080f20', fog: '#101827', hemi: '#596c9a', ground: '#15271f', intensity: 0.95 },
    };
    const palette = palettes[timeOfDay];
    if (this.scene.background instanceof THREE.Color) this.scene.background.set(palette.sky);
    else this.scene.background = new THREE.Color(palette.sky);
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.set(palette.fog);
      this.scene.fog.near = 55;
      this.scene.fog.far = 235;
    } else {
      this.scene.fog = new THREE.Fog(palette.fog, 55, 235);
    }
    this.skyLight.color.set(palette.hemi);
    this.skyLight.intensity = timeOfDay === 'night' ? 1.0 : 1.7;
    this.skyLight.groundColor.set(palette.ground);
    this.sunLight.intensity = palette.intensity;
    this.sunLight.color.set(timeOfDay === 'night' ? '#9eb6ff' : timeOfDay === 'sunset' ? '#ffae8a' : '#fff1cf');
    (this.ground.material as THREE.MeshStandardMaterial).color.set(timeOfDay === 'night' ? '#101d23' : palette.ground);
  }

  private updateCamera() {
    // Keep camera smoothly anchored behind player car during lane changes and drift slides
    const curveAhead = this.getTrackCurveAhead();
    const targetCamX = this.currentPlayerX * 0.82;
    const targetLookX = this.currentPlayerX * 0.65 + curveAhead * 2.2;

    // Smoothly interpolate camera position to eliminate camera glitching/jerking
    this.smoothCameraX += (targetCamX - this.smoothCameraX) * 0.18;
    this.smoothLookAtX += (targetLookX - this.smoothLookAtX) * 0.18;

    const shake = this.reducedMotion ? 0 : this.cameraShake * 0.022;

    // Dynamic FOV based on vehicle velocity
    const targetFov = Math.min(68, 54 + Math.max(0, (this.currentSpeedMph - 70) * 0.12));
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }

    this.camera.position.set(this.smoothCameraX + (Math.random() - 0.5) * shake, 6.2 + shake, 12.0);
    this.camera.lookAt(this.smoothLookAtX, 0.9, -28);
  }

  private toWorldPosition(x: number, y: number) {
    const lateral = ((x - this.roadX) / this.roadWidth - 0.5) * ROAD_WIDTH;
    const z = (y - this.playerY) * PIXEL_TO_WORLD;
    const progress = this.currentProgress - z;
    const pathOffset = this.trackCenterAt(progress) - this.trackCenterAt(this.currentProgress);
    return { x: lateral + pathOffset, z };
  }

  private trackCenterAt(progress: number): number {
    let center = Math.sin(progress / 145) * 10 + Math.sin(progress / 390) * 8;
    for (const turn of this.routeTurns) {
      const progressAfterTurn = progress - turn.distance;
      if (progressAfterTurn > 0) {
        const eased = Math.min(1, progressAfterTurn / 65);
        center += turn.direction * 16 * eased;
      }
    }
    return center;
  }

  private createDecalTexture(decalPreset?: string, customDecalUrl?: string): THREE.Texture | null {
    if (customDecalUrl) {
      const loader = new THREE.TextureLoader();
      const tex = loader.load(customDecalUrl);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    if (!decalPreset || decalPreset === 'none') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (decalPreset === 'twin_stripes') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(190, 0, 52, 512);
      ctx.fillRect(270, 0, 52, 512);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(180, 0, 6, 512);
      ctx.fillRect(326, 0, 6, 512);
    } else if (decalPreset === 'tokyo_drift') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(256, 256, 130, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('速', 256, 256);
    } else if (decalPreset === 'dragon_flames') {
      const grad = ctx.createLinearGradient(0, 512, 0, 0);
      grad.addColorStop(0, '#dc2626');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#fef08a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(100, 512);
      ctx.quadraticCurveTo(160, 320, 190, 150);
      ctx.quadraticCurveTo(220, 270, 256, 60);
      ctx.quadraticCurveTo(290, 270, 322, 150);
      ctx.quadraticCurveTo(352, 320, 412, 512);
      ctx.closePath();
      ctx.fill();
    } else if (decalPreset === 'cyber_hex') {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 6;
      for (let r = 70; r <= 210; r += 50) {
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const ang = (a * Math.PI) / 3;
          const x = 256 + Math.cos(ang) * r;
          const y = 256 + Math.sin(ang) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.fillStyle = '#06b6d4';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ CYBER 01', 256, 260);
    } else if (decalPreset === 'sponsor_racing') {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(256, 256, 160, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 14;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 160px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('77', 256, 260);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private createCarModel(
    primary: string,
    secondary: string,
    accent: string,
    widthScale: number,
    lengthScale: number,
    bodyStyle: string = 'sports',
    isPlayer: boolean = false,
    finish: string = 'gloss',
    spoilerStyle: string = 'gt_wing',
    wheelStyle: string = 'tuner5',
    decalPreset: string = 'none',
    customDecalUrl?: string
  ): { group: THREE.Group; frontWheels: THREE.Group[] } {
    const group = new THREE.Group();
    const frontWheels: THREE.Group[] = [];

    // Main Chassis with custom finish
    const metalness = finish === 'metallic' ? 0.85 : finish === 'chameleon' ? 0.95 : finish === 'matte' ? 0.05 : 0.45;
    const roughness = finish === 'metallic' ? 0.2 : finish === 'chameleon' ? 0.1 : finish === 'matte' ? 0.92 : 0.32;

    const bodyHeight = bodyStyle === 'hyper' || bodyStyle === 'prototype' ? 0.54 : 0.68;
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, bodyHeight, 3.9),
      this.material(primary, metalness, roughness)
    );
    body.position.y = 0.6;
    group.add(body);

    // Hood
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.17, 1.28),
      this.material(accent, 0.2, 0.38, 0.09)
    );
    hood.position.set(0, 0.98, -1.05);
    group.add(hood);

    // Cabin
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.66, 1.76),
      this.material(secondary, 0.2, 0.28)
    );
    cabin.position.set(0, 1.15, -0.05);
    group.add(cabin);

    // Windshield
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.08, 0.48),
      new THREE.MeshStandardMaterial({
        color: '#a5dcf4',
        metalness: 0.2,
        roughness: 0.16,
        transparent: true,
        opacity: 0.75,
      })
    );
    windshield.position.set(0, 1.5, -0.6);
    group.add(windshield);

    // Driver Helmet (visible through glass)
    const driverHelmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 12, 10),
      new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        metalness: 0.4,
        roughness: 0.2,
      })
    );
    driverHelmet.position.set(0.28, 1.35, -0.05);
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.09, 0.14),
      new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1 })
    );
    visor.position.set(0.28, 1.36, -0.2);
    group.add(driverHelmet, visor);

    // Custom Decals (Canva PNG upload or preset livery)
    const decalTex = this.createDecalTexture(decalPreset, customDecalUrl);
    if (decalTex) {
      const decalMat = new THREE.MeshBasicMaterial({
        map: decalTex,
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        depthWrite: false,
      });

      // Hood Decal
      const hoodDecal = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.15), decalMat);
      hoodDecal.rotation.x = -Math.PI / 2;
      hoodDecal.position.set(0, 1.072, -1.05);
      group.add(hoodDecal);

      // Roof Decal
      const roofDecal = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 1.45), decalMat);
      roofDecal.rotation.x = -Math.PI / 2;
      roofDecal.position.set(0, 1.488, -0.05);
      group.add(roofDecal);
    }

    // BODY STYLE & SPOILER SPECIALIZATIONS
    if (isPlayer && spoilerStyle !== 'stock') {
      if (spoilerStyle === 'ducktail') {
        const ducktail = new THREE.Mesh(
          new THREE.BoxGeometry(1.7, 0.18, 0.26),
          this.material('#0f172a', 0.2, 0.4)
        );
        ducktail.position.set(0, 1.02, 1.85);
        group.add(ducktail);
      } else if (spoilerStyle === 'drag') {
        const dragWing = new THREE.Mesh(
          new THREE.BoxGeometry(2.05, 0.08, 0.55),
          this.material('#0f172a', 0.2, 0.4)
        );
        dragWing.position.set(0, 1.46, 1.8);
        const lPylon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.2), this.material('#1e293b', 0.1, 0.8));
        lPylon.position.set(-0.65, 1.22, 1.8);
        const rPylon = lPylon.clone();
        rPylon.position.x = 0.65;
        group.add(dragWing, lPylon, rPylon);
      } else {
        // gt_wing
        const wing = new THREE.Mesh(
          new THREE.BoxGeometry(1.85, 0.06, 0.42),
          this.material('#0f172a', 0.2, 0.4)
        );
        wing.position.set(0, 1.38, 1.75);
        const leftPylon = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.38, 0.14),
          this.material('#1e293b', 0.1, 0.8)
        );
        leftPylon.position.set(-0.55, 1.18, 1.75);
        const rightPylon = leftPylon.clone();
        rightPylon.position.x = 0.55;
        group.add(wing, leftPylon, rightPylon);
      }
    } else if (bodyStyle === 'tuner' || bodyStyle === 'gt3' || bodyStyle === 'sports') {
      // Rear High-Rise Drift Wing / GT Spoiler
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 0.06, 0.42),
        this.material('#0f172a', 0.2, 0.4)
      );
      wing.position.set(0, 1.38, 1.75);
      const leftPylon = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.38, 0.14),
        this.material('#1e293b', 0.1, 0.8)
      );
      leftPylon.position.set(-0.55, 1.18, 1.75);
      const rightPylon = leftPylon.clone();
      rightPylon.position.x = 0.55;
      group.add(wing, leftPylon, rightPylon);
    } else if (bodyStyle === 'muscle') {
      // Exposed Supercharger Blower through Hood
      const blower = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.45, 0.72),
        new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.2 })
      );
      blower.position.set(0, 1.25, -1.0);
      const scoop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.5, 8),
        new THREE.MeshBasicMaterial({ color: '#ea580c' })
      );
      scoop.rotation.z = Math.PI / 2;
      scoop.position.set(0, 1.48, -1.1);
      group.add(blower, scoop);
    } else if (bodyStyle === 'prototype' || bodyStyle === 'hyper') {
      // Le Mans Dorsal Fin & Splitter
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.52, 1.8),
        this.material('#4c1d95', 0.3, 0.4)
      );
      fin.position.set(0, 1.42, 0.7);
      const frontSplitter = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.08, 0.55),
        this.material('#020617', 0.2, 0.8)
      );
      frontSplitter.position.set(0, 0.35, -2.05);
      group.add(fin, frontSplitter);
    } else if (bodyStyle === 'police') {
      // Police Strobe Lightbar & Bullbar
      const lightbarBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.14, 0.26),
        new THREE.MeshBasicMaterial({ color: '#0f172a' })
      );
      lightbarBase.position.set(0, 1.55, 0);
      const redStrobe = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.12, 0.22),
        new THREE.MeshBasicMaterial({ color: '#ef4444' })
      );
      redStrobe.position.set(-0.32, 1.56, 0);
      const blueStrobe = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.12, 0.22),
        new THREE.MeshBasicMaterial({ color: '#0284c7' })
      );
      blueStrobe.position.set(0.32, 1.56, 0);
      const bullbar = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.42, 0.18),
        new THREE.MeshStandardMaterial({ color: '#020617', metalness: 0.8, roughness: 0.3 })
      );
      bullbar.position.set(0, 0.58, -2.05);
      group.add(lightbarBase, redStrobe, blueStrobe, bullbar);
    } else if (bodyStyle === 'concept') {
      // Solar Concept Aerodynamic Finlets
      const leftFinlet = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.45, 0.8),
        this.material('#0284c7', 0.4, 0.3)
      );
      leftFinlet.position.set(-0.85, 1.15, 1.4);
      const rightFinlet = leftFinlet.clone();
      rightFinlet.position.x = 0.85;
      group.add(leftFinlet, rightFinlet);
    }

    // Wheels with Steering Pivots for Front Wheels
    const rimColor =
      wheelStyle === 'gold_jdm'
        ? '#fbbf24'
        : wheelStyle === 'deep_dish'
          ? '#f1f5f9'
          : wheelStyle === 'stock'
            ? '#334155'
            : '#94a3b8';

    const wheelGeometry = new THREE.CylinderGeometry(0.39, 0.39, 0.25, 14);
    const wheelMaterial = this.material('#111827', 0.03, 0.88);
    const rimGeometry = new THREE.CylinderGeometry(0.24, 0.24, 0.26, 12);
    const rimMaterial = this.material(rimColor, 0.8, 0.2);

    // Front Wheels (with pivot groups for counter-steering)
    for (const x of [-0.98, 0.98]) {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.38, -1.25);
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      pivot.add(wheel, rim);
      group.add(pivot);
      if (isPlayer) {
        frontWheels.push(pivot);
      }
    }

    // Rear Wheels (rigidly attached)
    for (const x of [-0.98, 0.98]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      const rearAssembly = new THREE.Group();
      rearAssembly.position.set(x, 0.38, 1.25);
      rearAssembly.add(wheel, rim);
      group.add(rearAssembly);
    }

    // Headlights & Taillights
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: '#dff6ff' });
    for (const x of [-0.68, 0.68]) {
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.07), headlightMaterial);
      light.position.set(x, 0.76, -1.98);
      group.add(light);
      const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.12, 0.08),
        new THREE.MeshBasicMaterial({ color: '#fb344d' })
      );
      tail.position.set(x, 0.74, 1.98);
      group.add(tail);
    }

    const shadow = this.createShadow(2.15, 4.2);
    shadow.position.y = 0.02;
    group.add(shadow);
    group.scale.set(widthScale, 1, lengthScale);

    return { group, frontWheels };
  }

  private createShadow(w: number, l: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, l),
      new THREE.MeshBasicMaterial({
        color: '#020617',
        transparent: true,
        opacity: 0.45,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  private createPickup(type: Pickup['type']): THREE.Group {
    const group = new THREE.Group();
    const palette = {
      coin: '#fbbf24',
      nitro: '#22d3ee',
      repair: '#34d399',
      speed_boost: '#f59e0b',
      shield: '#38bdf8',
    };
    const color = palette[type];
    if (type === 'coin') {
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.56, 0.56, 0.14, 24),
        new THREE.MeshStandardMaterial({
          color,
          metalness: 0.85,
          roughness: 0.22,
          emissive: '#b7791f',
          emissiveIntensity: 0.3,
        })
      );
      coin.rotation.x = Math.PI / 2;
      group.add(coin);
    } else {
      const geometry =
        type === 'shield'
          ? new THREE.IcosahedronGeometry(0.7, 1)
          : type === 'repair'
            ? new THREE.BoxGeometry(0.9, 0.9, 0.9)
            : new THREE.OctahedronGeometry(0.72, 0);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.45,
        metalness: 0.55,
        roughness: 0.25,
      });
      group.add(new THREE.Mesh(geometry, material));
    }
    const glow = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.055, 8, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82 })
    );
    group.add(glow);
    return group;
  }

  private createSceneryObject(type: RoadsideObject['type']): THREE.Group {
    const group = new THREE.Group();
    if (type === 'palm') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 3.4, 8), this.material('#865331', 0, 1));
      trunk.position.y = 1.7;
      group.add(trunk);
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.8, 1.5, 7),
        this.material(this.timeOfDay === 'night' ? '#0d5944' : '#228447', 0, 1)
      );
      leaves.position.y = 3.6;
      group.add(leaves);
    } else if (type === 'lamp') {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.2, 8), this.material('#94a3b8', 0.6, 0.4));
      post.position.y = 2.6;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.28), this.material('#475569', 0.5, 0.5));
      head.position.set(0.24, 5.2, 0);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        new THREE.MeshBasicMaterial({ color: this.timeOfDay === 'night' ? '#fef08a' : '#cbd5e1' })
      );
      bulb.position.set(0.42, 5.12, 0);
      group.add(post, head, bulb);
    } else if (type === 'sakura') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 3.8, 8), this.material('#451a03', 0.1, 0.9));
      trunk.position.y = 1.9;
      group.add(trunk);
      const blossoms = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.9, 1),
        this.material('#f472b6', 0.2, 0.4, 0.3)
      );
      blossoms.position.y = 4.0;
      group.add(blossoms);
    } else if (type === 'canyon') {
      const rock = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 2.4, 6.5, 6),
        this.material('#9a3412', 0.1, 0.9)
      );
      rock.position.y = 3.25;
      group.add(rock);
    } else {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), this.material('#94a3b8', 0.5, 0.5));
      post.position.y = 1.6;
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.08), this.material('#0284c7', 0.1, 0.9));
      board.position.set(0, 3.2, 0);
      group.add(post, board);
    }
    return group;
  }

  private updatePickupLabel(
    id: number,
    type: Pickup['type'],
    showLabels: boolean,
    position: { x: number; z: number }
  ) {
    if (!showLabels) return;
    let sprite = this.pickupLabels.get(id);
    if (!sprite) {
      const labels: Record<Pickup['type'], string> = {
        coin: 'COIN',
        nitro: 'NITRO',
        repair: 'FIX',
        speed_boost: 'BOOST',
        shield: 'SHIELD',
      };
      sprite = this.createTextSprite(labels[type], '#f8fafc', 22);
      this.world.add(sprite);
      this.pickupLabels.set(id, sprite);
    }
    sprite.position.set(position.x, 2.2, position.z);
    sprite.visible = Math.abs(position.z) < 225;
  }

  private createRivalTagSprite(name: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(16, 8, 224, 48, 12);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = 'bold 24px "Rajdhani", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.slice(0, 12), 128, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(3.8, 0.95, 1);
    return sprite;
  }

  private createTextSprite(text: string, color = '#ffffff', fontSize = 36): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `900 ${fontSize}px "Rajdhani", "Outfit", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 7;
      ctx.strokeText(text, 192, 64);
      ctx.fillStyle = color;
      ctx.fillText(text, 192, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(3.8, 1.25, 1);
    return sprite;
  }

  private removeInactive<T extends { visible: boolean }>(
    map: Map<unknown, T>,
    activeIds: Set<unknown>
  ) {
    for (const [id, item] of map.entries()) {
      if (!activeIds.has(id)) {
        if ('parent' in (item as unknown as { parent: unknown })) {
          this.world.remove(item as unknown as THREE.Object3D);
        }
        map.delete(id);
      }
    }
  }

  private material(color: string, metalness = 0.2, roughness = 0.5, emissiveIntensity = 0): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      emissive: emissiveIntensity > 0 ? color : '#000000',
      emissiveIntensity,
    });
  }
}
