"use strict";
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OBJLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

var camera, renderer;
var ground = true;

window.scene = new THREE.Scene();
var cameraControls;
var clock = new THREE.Clock();
var toitMovible = null;
var potPosition = { x: 100, y: 260, z: 350 };
var pumpLedMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
var lockMaterial = null;

function fillScene() {
    var light = new THREE.DirectionalLight(0xFFFFFF, 2);
    light.position.set(-1300, 700, 1240);
    window.scene.add(light);

    // var cubeLoader = new THREE.CubeTextureLoader().setPath('assets/skybox/');
    // cubeLoader.load(
    //     ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    //     function(cubeTex){ window.scene.background = cubeTex; }
    // );
    window.scene.background = new THREE.Color(0x87CEEB);

    drawTable();
    drawWall();
    drawfloor();
    drawSerreFloor();
    drawSerreWalls();
    drawSupportToit();
    drawToitFix();
    drawToitMovible();
    drawLED();
    drawPot();
    drawPlantStem();
    drawPlantFlower();
    drawPump();
    drawPumpLock();
}

function drawTable() {
    // var Textureloader = new THREE.TextureLoader();
    // var TableTexture = Textureloader.load('./assets/wood.jpg');
    var material = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // replace with: { map: TableTexture }

    var table = new THREE.Mesh(new THREE.BoxGeometry(600, 30, 600), material);
    table.position.set(0, 205, 500);
    // table.receiveShadow = true; // shadow_code
    window.scene.add(table);

    var legPositions = [[-280,40,220],[280,40,220],[-280,40,780],[280,40,780]];
    legPositions.forEach(pos => {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(40, 300, 40), material);
        leg.position.set(...pos);
        // leg.receiveShadow = true; // shadow_code
        window.scene.add(leg);
    });
}

function drawWall() {
    // var Textureloader = new THREE.TextureLoader();
    // var WallTexture = Textureloader.load('./assets/Wall.png');
    var wall = new THREE.Mesh(
        new THREE.BoxGeometry(2000, 1500, 50),
        new THREE.MeshPhongMaterial({ color: 0xCCCCCC }) // replace with: { map: WallTexture }
    );
    wall.position.set(0, 640, 150);
    // wall.receiveShadow = true; // shadow_code
    window.scene.add(wall);
}

function drawfloor() {
    // var Textureloader = new THREE.TextureLoader();
    // var FloorTexture = Textureloader.load('./assets/Wall.png');
    var floor = new THREE.Mesh(
        new THREE.BoxGeometry(2000, 50, 2000),
        new THREE.MeshPhongMaterial({ color: 0x999999 }) // replace with: { map: FloorTexture }
    );
    floor.position.set(0, -135, 1125);
    // floor.receiveShadow = true; // shadow_code
    window.scene.add(floor);
}

function drawSerreFloor() {
    var floor = new THREE.Mesh(
        new THREE.BoxGeometry(380, 10, 200),
        new THREE.MeshPhongMaterial({ color: 0xB68E65 })
    );
    floor.position.set(0, 222.5, 350);
    // floor.receiveShadow = true; // shadow_code
    window.scene.add(floor);
}

function drawSerreWalls() {
    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        shininess: 100,
        specular: 0xffffff,
        side: THREE.DoubleSide
    });

    var wallsPossitions = [[0, 313.5, 250], [0, 313.5, 450]];
    wallsPossitions.forEach(pos => {
        var walls = new THREE.Mesh(new THREE.BoxGeometry(380, 172, 10), material);
        walls.position.set(...pos);
        window.scene.add(walls);
    });

    var sideWallsPositions = [[185, 313.5, 350], [-185, 313.5, 350]];
    sideWallsPositions.forEach(pos => {
        var sideWall = new THREE.Mesh(new THREE.BoxGeometry(10, 172, 200), material);
        sideWall.position.set(...pos);
        window.scene.add(sideWall);
    });
}

function drawSupportToit() {
    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        shininess: 100,
        specular: 0xffffff,
        side: THREE.DoubleSide
    });

    var supportToitPositions = [[0, 400, 350], [0, 400, 550]];
    supportToitPositions.forEach(pos => {
        var geometry = new THREE.BufferGeometry();
        var vertices = new Float32Array([
            -190, 0, -100,
             190, 0, -100,
               0, 72, -100,
        ]);
        var indices = [0, 1, 2];
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...pos);
        window.scene.add(mesh);
    });
}

function drawToitFix() {
    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        shininess: 100,
        specular: 0xffffff,
        side: THREE.DoubleSide
    });

    var geometry = new THREE.BoxGeometry(5, 210, 200);
    var toit = new THREE.Mesh(geometry, material);
    toit.position.set(-99, 437, 350);
    toit.rotation.z = -(Math.PI / 2.6);
    window.scene.add(toit);
}

function drawToitMovible() {
    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        shininess: 100,
        specular: 0xffffff,
        side: THREE.DoubleSide
    });

    var geometry = new THREE.BoxGeometry(5, 210, 200);
    var toit = new THREE.Mesh(geometry, material);
    toit.position.set(0, -105, 0);

    toitMovible = new THREE.Object3D();
    toitMovible.position.set(190, 400, 350);
    toitMovible.rotation.z = Math.PI / 2.6;
    toitMovible.add(toit);

    window.scene.add(toitMovible);
}

function drawLED() {
    var material = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    var ledPosition = [[-100, 430, 310], [-100, 430, 390]];
    ledPosition.forEach(pos => {
        var led = new THREE.Mesh(new THREE.BoxGeometry(2, 100, 15), material);
        led.position.set(...pos);
        led.rotation.z = -(Math.PI / 2.6);
        window.scene.add(led);
    });
}

function drawPot() {
    var sideMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 });
    var topMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var bottomMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 });

    var pot = new THREE.Mesh(
        new THREE.CylinderGeometry(40, 30, 70, 32),
        [sideMaterial, topMaterial, bottomMaterial]
    );
    pot.position.set(potPosition.x, potPosition.y, potPosition.z);
    // pot.castShadow = true; // shadow_code
    // pot.receiveShadow = true; // shadow_code
    window.scene.add(pot);
}

function drawPlantStem() {
    var material = new THREE.MeshPhongMaterial({ color: 0x228B22 });
    var plant = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 80, 32), material);
    plant.position.set(potPosition.x, potPosition.y + 70, potPosition.z);
    // plant.castShadow = true; // shadow_code
    // plant.receiveShadow = true; // shadow_code
    window.scene.add(plant);
}

function drawPlantFlower() {
    var material = new THREE.MeshPhongMaterial({ color: 0xFF69B4 });
    var flower = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 32), material);
    flower.position.set(potPosition.x, potPosition.y + 110, potPosition.z);
    // flower.castShadow = true; // shadow_code
    // flower.receiveShadow = true; // shadow_code
    window.scene.add(flower);
}

function drawPump() {
    var material = new THREE.MeshPhongMaterial({ color: 0x0000FF });
    var pump = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 30, 32), material);
    pump.position.set(50, 242, 420);
    window.scene.add(pump);

    var pumpLed = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 10, 32), pumpLedMaterial);
    pumpLed.position.set(60, 257, 420);
    window.scene.add(pumpLed);

    var pumpTop = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), pumpLedMaterial);
    pumpTop.position.set(60, 262, 420);
    window.scene.add(pumpTop);
}

function drawPumpLock() {
    var Textureloader = new THREE.TextureLoader();
    var lockTexture = Textureloader.load('/static/js/texture/lock.png');
    lockMaterial = new THREE.MeshBasicMaterial({ map: lockTexture, transparent: true, opacity: 0 });
    var lock = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 0.1), lockMaterial);
    lock.position.set(50, 242, 437);
    window.scene.add(lock);
}

function init() {
    var container = document.querySelector('.container');
    var canvasWidth = container.offsetWidth;
    var canvasHeight = 700;
    var canvasRatio = canvasWidth / canvasHeight;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x999999, 1.0);
    // renderer.shadowMap.enabled = true; // shadow_code

    camera = new THREE.PerspectiveCamera(30, canvasRatio, 1, 10000);
    cameraControls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 300, 1500);
    cameraControls.target.set(0, 43, -8);

    // Lock camera
    cameraControls.enablePan = false;
    cameraControls.maxPolarAngle = Math.PI / 2;
    cameraControls.minPolarAngle = Math.PI / 4;
    cameraControls.minAzimuthAngle = -0.5;
    cameraControls.maxAzimuthAngle = 0.5;
    cameraControls.minDistance = 500;
    cameraControls.maxDistance = 2000;
    
}

function addToDOM() {
    var container = document.getElementById('webGL');
    var canvas = container.getElementsByTagName('canvas');
    if (canvas.length > 0) {
        container.removeChild(canvas[0]);
    }
    container.appendChild(renderer.domElement);
}

function animate() {
    window.requestAnimationFrame(animate);
    render();
}

var toitTargetAngle = -1.95;

window.setToitAngle = function(servoAngle) {
    toitTargetAngle = servoAngle >= 180 ? -2.2 : -1.95;
};

var ledLights = [];

var ledLightPosition = [
    { x: -100, y: 430, z: 310 },
    { x: -100, y: 430, z: 390 }
];

ledLightPosition.forEach(pos => {
    var light = new THREE.SpotLight(0xFF0000, 0);
    light.position.set(pos.x, pos.y, pos.z);
    light.distance = 400;
    light.angle = Math.PI / 15;
    light.penumbra = 0.2;
    // light.castShadow = true; // shadow_code

    var ledTarget = new THREE.Object3D();
    ledTarget.position.set(potPosition.x, potPosition.y + 70, potPosition.z);
    window.scene.add(ledTarget);
    light.target = ledTarget;

    window.scene.add(light);
    ledLights.push(light);
});

window.setLedIntensity = function(ledState) {
    var intensity = (ledState === 'ON') ? 1e10 : 0;
    ledLights.forEach(function(l) { l.intensity = intensity; });
};

window.setPompeState = function(pompeState) {
    pumpLedMaterial.color.set(pompeState === 'ON' ? 0x00ff00 : 0xff0000);
};

window.setPompeLock = function(lockTime) {
    if (lockMaterial) {
        if (lockTime == 0 || lockTime == 600) {
            lockMaterial.opacity = 0;
        } else {
            lockMaterial.opacity = 1;
        }
    }
};

function render() {
    var delta = clock.getDelta();
    cameraControls.update(delta);

    if (toitMovible) {
        toitMovible.rotation.z += (toitTargetAngle - toitMovible.rotation.z) * 0.05;
    }

    renderer.render(window.scene, camera);
}

try {
    init();
    fillScene();
    addToDOM();
    animate();
} catch(e) {
    console.error("WebGL error:", e);
}