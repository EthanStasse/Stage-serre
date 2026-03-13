"use strict";
import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var camera, renderer;
var ground = true;

window.scene = new THREE.Scene();
var cameraControls;
var clock = new THREE.Clock();
var toitMovible = null;
var beltMesh = null;
var potPosition = { x: 100, y: 260, z: 350 };
var pumpLedMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
var lockMaterial = null;
var waterlevel = 22;
var waterMesh = null;
var tankBottom = 225;
var waterTube = 0;
var innerPipeMaterial = null;
var innerPipeMaterial1 = null;
const DROP_COUNT = 30;
var dropMesh = null;
var dropData = [];
var temp = 0;
var humAir = 0;
var humSol = 0;
var lum = 0;

var dropOrigin = new THREE.Vector3(85, 300, 350);
var gravity = -0.15;
var dropTimer = 0;

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();

var splashParticles = [];

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
    drawPillars();
    drawSupportToit();
    drawToit();
    drawLED();
    drawPot();
    drawPlant();
    drawPump();
    drawPipe();
    drawWaterTank();
    drawWaterDrops();
    drawLCD();
    drawServo();
}

function drawTable() {
    var Textureloader = new THREE.TextureLoader();
    var TableTexture = Textureloader.load('/static/js/texture/bois.jpg');
    var material = new THREE.MeshPhongMaterial({ map: TableTexture });

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
    var Textureloader = new THREE.TextureLoader();
    var WallTexture = Textureloader.load('/static/js/texture/wall.png');
    var wall = new THREE.Mesh(
        new THREE.BoxGeometry(2000, 1500, 50),
        new THREE.MeshPhongMaterial({ map: WallTexture }) // replace with: { map: WallTexture }
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

function drawPillars() {
    var Textureloader = new THREE.TextureLoader();
    var pillarTexture = Textureloader.load('/static/js/texture/bois.jpg');
    var material = new THREE.MeshPhongMaterial({
        map: pillarTexture
    });

    var pillarPositions = [[-188, 313.5, 252], [188, 313.5, 252], [-188, 313.5, 448], [188, 313.5, 448]];
    pillarPositions.forEach(pos => {
        var pillar = new THREE.Mesh(new THREE.BoxGeometry(10, 171, 10), material);
        pillar.position.set(...pos);
        window.scene.add(pillar);
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

function drawToit() {
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

    var geometry2 = new THREE.BoxGeometry(5, 210, 200);
    var toit2 = new THREE.Mesh(geometry2, material);
    toit2.position.set(0, -105, 0);

    toitMovible = new THREE.Object3D();
    toitMovible.position.set(194, 397.5, 350);
    toitMovible.rotation.z = Math.PI / 2.6;
    toitMovible.add(toit2);

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
    var Textureloader = new THREE.TextureLoader();
    var sideTexture = Textureloader.load('/static/js/texture/pot.jpg');
    var topTexture = Textureloader.load('/static/js/texture/dirt.jpg');
    var sideMaterial = new THREE.MeshPhongMaterial({ map: sideTexture });
    var topMaterial = new THREE.MeshPhongMaterial({ map: topTexture });
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

function drawPlant() {
    var Textureloader = new THREE.TextureLoader();
    var stemTexture = Textureloader.load('/static/js/texture/stem.jpg');
    var material = new THREE.MeshPhongMaterial({ map: stemTexture });
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 80, 32), material);
    stem.position.set(potPosition.x, potPosition.y + 70, potPosition.z);
    // stem.castShadow = true; // shadow_code
    // stem.receiveShadow = true; // shadow_code
    window.scene.add(stem);

    var material = new THREE.MeshPhongMaterial({ color: 0xFF69B4 });
    var flower = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 32), material);
    flower.position.set(potPosition.x, potPosition.y + 110, potPosition.z);
    // flower.castShadow = true; // shadow_code
    // flower.receiveShadow = true; // shadow_code
    window.scene.add(flower);

    var leafTexture = Textureloader.load('/static/js/texture/Leaves.jpg');
    var leafMaterial = new THREE.MeshPhongMaterial({ map: leafTexture, transparent: true });
    var bottomLeafsLocation = [
        { x: potPosition.x - 8, y: potPosition.y + 40, z: potPosition.z, rotationz: -(Math.PI/1.2) },
        { x: potPosition.x + 8, y: potPosition.y + 40, z: potPosition.z, rotationz: Math.PI/1.2}
    ];
    bottomLeafsLocation.forEach(pos => {
        var leaf = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0005, 0.01, 20, 32),
            leafMaterial
        );
        leaf.position.set(pos.x, pos.y, pos.z);
        leaf.rotation.z = pos.rotationz;
        leaf.scale.set(500, 1, 1); 
        window.scene.add(leaf);
    });

    var topLeafsLocation = [
        { x: potPosition.x - 18, y: potPosition.y + 57, z: potPosition.z, rotationz: -(Math.PI/1.2)+Math.PI },
        { x: potPosition.x + 18, y: potPosition.y + 57, z: potPosition.z, rotationz: Math.PI/1.2+Math.PI }
    ];
    topLeafsLocation.forEach(pos => {
        var leaf = new THREE.Mesh(
            new THREE.CylinderGeometry(0, 0.01, 20, 32),
            new THREE.MeshPhongMaterial({ map : leafTexture, transparent: true})
        );
        leaf.position.set(pos.x, pos.y, pos.z);
        leaf.rotation.z = pos.rotationz;
        leaf.scale.set(500, 1, 1); 
        window.scene.add(leaf);
    });
}

function drawPump() {
    var material = new THREE.MeshPhongMaterial({ color: 0x0000FF });
    var pump = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 30, 32), material);
    pump.position.set(50, 242, 420);
    window.scene.add(pump);

    var pumpLed = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 10, 32), pumpLedMaterial);
    pumpLed.position.set(60, 257, 420);
    window.scene.add(pumpLed);

    var pumpLEDTop = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), pumpLedMaterial);
    pumpLEDTop.position.set(60, 262, 420);
    window.scene.add(pumpLEDTop);

    //pump lock
    var Textureloader = new THREE.TextureLoader();
    var lockTexture = Textureloader.load('/static/js/texture/lock.png');
    lockMaterial = new THREE.MeshBasicMaterial({ map: lockTexture, transparent: true, opacity: 0 });
    var lock = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 0.1), lockMaterial);
    lock.position.set(50, 242, 437);
    window.scene.add(lock);
}

function drawPipe() {
    var curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(50, 232, 420),
        new THREE.Vector3(0, 242, 400),
        new THREE.Vector3(0, 242, 350),
        new THREE.Vector3(50, 295, 350),
        new THREE.Vector3(85, 300, 350),
    ]);

    var geometry = new THREE.TubeGeometry(curve,20,3,8,false);

    var material = new THREE.MeshPhongMaterial({         
        color: 0x000000,
        transparent: true,
        opacity: 0.3,
        shininess: 100,
        specular: 0x888888,
        side: THREE.DoubleSide, 
        depthWrite: false
    });
    var pipe = new THREE.Mesh(geometry, material);
    pipe.frustumCulled = false;  // ✅ prevents disappearing on camera rotate
    window.scene.add(pipe);

    var innerGeometry = new THREE.TubeGeometry(curve,20,1,8,false);

    innerPipeMaterial = new THREE.MeshPhongMaterial({
        color: 0x0000FF,
        transparent: true,
        opacity: waterTube,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
    });

    var innerPipe = new THREE.Mesh(innerGeometry, innerPipeMaterial);
    innerPipe.frustumCulled = false;  // ✅ prevents disappearing on camera rotate
    window.scene.add(innerPipe);

    var curve1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(60, 252, 420),
        new THREE.Vector3(100, 257, 420),
        new THREE.Vector3(150, 262, 420),
        new THREE.Vector3(160, 262, 420),
        new THREE.Vector3(162, 240, 420),
    ]);

    var geometry1 = new THREE.TubeGeometry(curve1,50,3,8,false);

    var material1 = new THREE.MeshPhongMaterial({         
        color: 0x000000,
        transparent: true,
        opacity: 0.3,
        shininess: 100,
        specular: 0x888888,
        side: THREE.DoubleSide,
        depthWrite: false  // ✅ lets inner pipe show through
    });
    var pipe1 = new THREE.Mesh(geometry1, material1);
    pipe1.frustumCulled = false;  // ✅ prevents disappearing on camera rotate
    window.scene.add(pipe1);

    var innerGeometry1 = new THREE.TubeGeometry(curve1,50,1,8,false);

    innerPipeMaterial1 = new THREE.MeshPhongMaterial({
        color: 0x0000FF,
        transparent: true,
        opacity: waterTube,
        polygonOffset: true,       // ✅
        polygonOffsetFactor: -1,   // ✅
        polygonOffsetUnits: -1,    // ✅
    });

    var innerPipe1 = new THREE.Mesh(innerGeometry1, innerPipeMaterial1);
    innerPipe1.frustumCulled = false;  // ✅ prevents disappearing on camera rotate
    window.scene.add(innerPipe1);
}

function drawWaterTank() {
    var material = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.5, depthWrite: false });
    var tank = new THREE.Mesh(new THREE.BoxGeometry(40, 30, 40), material);
    tank.position.set(162, 240, 420);
    tank.frustumCulled = false;  // ✅ prevents disappearing on camera rotate
    window.scene.add(tank);

    var material = new THREE.MeshPhongMaterial({ 
        color: 0x0000FF, 
        transparent: true, 
        opacity: 0.5, 
        depthWrite: false 
    });
    waterMesh = new THREE.Mesh(new THREE.BoxGeometry(30, waterlevel, 32), material);
    waterMesh.position.set(162, tankBottom + waterlevel / 2, 420);
    waterMesh.frustumCulled = false;  // ✅ prevents disappearing on camera rotate
    window.scene.add(waterMesh);
}

function drawWaterDrops() {

    const geometry = new THREE.SphereGeometry(1, 8, 8);

    const material = new THREE.MeshPhongMaterial({
        color: 0x4aa3ff,
        transparent: true,
        opacity: 0.9
    });

    dropMesh = new THREE.InstancedMesh(geometry, material, DROP_COUNT);
    window.scene.add(dropMesh);

    for (let i = 0; i < DROP_COUNT; i++) {

        dropData.push({
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            active: false
        });

        tempMatrix.identity();
        dropMesh.setMatrixAt(i, tempMatrix);
    }

    dropMesh.instanceMatrix.needsUpdate = true;
}

function createSplash(position) {

    const geo = new THREE.SphereGeometry(0.6, 6, 6);
    const mat = new THREE.MeshPhongMaterial({ color: 0x4aa3ff });

    for (let i = 0; i < 5; i++) {

        let p = new THREE.Mesh(geo, mat);

        p.position.copy(position);

        p.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.4,
            (Math.random() - 0.5) * 0.5
        );

        p.userData.life = 0.4;

        window.scene.add(p);
        splashParticles.push(p);
    }
}

function drawLCD(){

    var lcdCanvas = document.createElement('canvas');
    lcdCanvas.width = 356;
    lcdCanvas.height = 64;
    var lcdCtx = lcdCanvas.getContext('2d');
    lcdCtx.fillStyle = '#006400';
    lcdCtx.fillRect(0, 0, 356, 64);
    lcdCtx.fillStyle = '#000000';
    lcdCtx.font = 'bold 20px monospace';
    lcdCtx.fillText('Temp: ' + temp + 'C', 10, 25);
    lcdCtx.fillText('Hum sol: ' + humSol, 10, 50);
    lcdCtx.fillText('Lum: ' + lum + 'Lux', 170, 25);
    lcdCtx.fillText('Hum air: ' + humAir + '%', 170, 50);
    var lcdTexture = new THREE.CanvasTexture(lcdCanvas);

    var material = new THREE.MeshPhongMaterial({
        map: lcdTexture,
        transparent: true,
        opacity: 0.9,
        shininess: 100,
        side: THREE.DoubleSide
    });

    var lcdScreen = new THREE.Mesh(
        new THREE.BoxGeometry(120, 20, 10),
        material
    );
    lcdScreen.position.set(-80, 340, 455);
    window.scene.add(lcdScreen); 

    var lcdBack = new THREE.Mesh(
        new THREE.BoxGeometry(135, 35, 5),
        new THREE.MeshPhongMaterial({ color: 0x006600 })
    );
    lcdBack.position.set(-80, 340, 450);
    window.scene.add(lcdBack);

    window.setLCDText = function() {
        lcdCtx.fillStyle = '#006400';
        lcdCtx.fillRect(0, 0, 356, 64);
        lcdCtx.fillStyle = '#000000';
        lcdCtx.font = 'bold 20px monospace';
        lcdCtx.fillText('Temp: ' + temp.toFixed(1) + 'C', 10, 25);
        lcdCtx.fillText('Hum sol: ' + humSol, 10, 50);
        lcdCtx.fillText('Lum: ' + lum + 'Lux', 170, 25);
        lcdCtx.fillText('Hum air: ' + humAir.toFixed(1) + '%', 170, 50);
        lcdTexture.needsUpdate = true;
    };

}

function drawServo(){

    var servo = new THREE.Mesh(new THREE.BoxGeometry(20, 40, 20), new THREE.MeshPhongMaterial({ color: 0x333333 }));
    servo.position.set(70, 420, 450);
    servo.rotation.z = Math.PI/2.6;
    window.scene.add(servo);

    var axe = new THREE.Mesh(new THREE.CylinderGeometry(2,2,30,24), new THREE.MeshPhongMaterial({color: 0x8E8E8E}));
    axe.position.set(80, 420, 430);
    axe.rotation.x = Math.PI/2;
    window.scene.add(axe);

    var shape = new THREE.Shape();

    var r1 = 10, cx1 = -65, cy1 = 0;
    var r2 = 15, cx2 = 0,    cy2 = 0;

    shape.moveTo(cx1, cy1 + r1);
    shape.lineTo(cx2, cy2 + r2);

    shape.absarc(cx2, cy2, r2, Math.PI / 2, -Math.PI / 2, true);

    shape.lineTo(cx1, cy1 - r1);

    shape.absarc(cx1, cy1, r1, -Math.PI / 2, Math.PI / 2, true);

    var geometry = new THREE.ShapeGeometry(shape);
    var material = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide });
    beltMesh = new THREE.Mesh(geometry, material);
    beltMesh.position.set(80, 420, 430);  // centré sur le grand cercle = position du servo
    beltMesh.rotation.z = -(Math.PI*1.3);
    window.scene.add(beltMesh);    

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
    camera.position.set(0, 500, 1500);
    cameraControls.target.set(0, 43, -8);

    // lock camera
    cameraControls.enablePan = false;
    cameraControls.maxPolarAngle = Math.PI / 2.3;
    cameraControls.minPolarAngle = Math.PI / 4;
    cameraControls.minAzimuthAngle = -0.2;
    cameraControls.maxAzimuthAngle = 0.2;
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
    var intensity = (ledState === 'ON') ? 250000 : 0;
    ledLights.forEach(function(l) { l.intensity = intensity; });
};

window.setPompeState = function(pompeState) {
    pumpLedMaterial.color.set(pompeState === 'ON' ? 0x00ff00 : 0xff0000);
    if (pompeState === 'ON') {
        waterlevel = Math.max(0, waterlevel - 0.5);  // ✅ never goes below 0
        waterTube = 0.8;  // ✅ make tube visible when pump is on
    } else {
        waterTube = 0;  // ✅ hide tube when pump is off
    }
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

window.setTemp = function(newTemp) {    
    temp = newTemp;
    if (window.setLCDText) window.setLCDText();
};

window.setHumAir = function(newHumAir) {
    humAir = newHumAir;
    if (window.setLCDText) window.setLCDText();
};

window.setHumSol = function(newHumSol) {
    humSol = newHumSol;
    if (window.setLCDText) window.setLCDText();
};

window.setLumiere = function(newLumiere) {
    lum = newLumiere;
    if (window.setLCDText) window.setLCDText();
};

function render() {
    var delta = clock.getDelta();
    cameraControls.update(delta);

    if (toitMovible) {
        toitMovible.rotation.z += (toitTargetAngle - toitMovible.rotation.z) * 0.05;
        if (beltMesh) {
            beltMesh.rotation.z += (toitTargetAngle - toitMovible.rotation.z) * 0.15;
        }
    }

    if (waterMesh) {
        waterMesh.scale.y = waterlevel / 20;
        waterMesh.position.y = tankBottom + (waterlevel / 2) * (waterlevel / 20);
    }

    if (innerPipeMaterial) {
        innerPipeMaterial.opacity = waterTube;
    }

    if (innerPipeMaterial1) {
        innerPipeMaterial1.opacity = waterTube;
    }

    dropTimer += delta;

    for (let i = 0; i < DROP_COUNT; i++) {

        const drop = dropData[i];

        if (waterTube > 0) {

            if (!drop.active && dropTimer > 0.05) {

                drop.active = true;
                drop.position.copy(dropOrigin);

                drop.velocity.set(
                    (Math.random() - 0.5) * 0.2,
                    -2,
                    (Math.random() - 0.5) * 0.2
                );

                dropTimer = 0;
            }

            if (drop.active) {

                drop.velocity.y += gravity;
                drop.position.add(drop.velocity);

                if (drop.position.y < potPosition.y + 40) {

                    createSplash(drop.position);
                    drop.active = false;

                }

            }

        } else {

            drop.active = false;

        }

        if (drop.active) {
            tempPosition.copy(drop.position);
        } else {
            tempPosition.set(0, -1000, 0);
        }

        tempMatrix.setPosition(tempPosition);
        dropMesh.setMatrixAt(i, tempMatrix);
    }

    dropMesh.instanceMatrix.needsUpdate = true;

    /* Update splash particles */
    splashParticles.forEach((p, i) => {

        p.userData.velocity.y += gravity * 0.3;
        p.position.add(p.userData.velocity);

        p.userData.life -= delta;

        if (p.userData.life <= 0) {
            window.scene.remove(p);
            splashParticles.splice(i, 1);
        }

    });

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