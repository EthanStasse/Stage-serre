"use strict";
import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OBJLoader } from 'https://unpkg.com/three@0.158.0/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js';

var camera, renderer;
var ground = true;

window.scene = new THREE.Scene();
var cameraControls;
var clock = new THREE.Clock();

function fillScene() {
    var light = new THREE.DirectionalLight( 0xFFFFFF, 0.9 );
    light.position.set( -1300, 700, 1240 );
    window.scene.add( light );

    light = new THREE.DirectionalLight( 0xFFFFFF, 0.7 );
    light.position.set( 1000, -500, -1200 );
    window.scene.add( light );

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
}

function drawTable(){
    // var Textureloader = new THREE.TextureLoader();
    // var TableTexture = Textureloader.load('./assets/wood.jpg');
    var material = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // replace with: { map: TableTexture }

    var table = new THREE.Mesh(new THREE.BoxGeometry(600, 30, 600), material);
    table.position.set(0, 205, 500);
    window.scene.add(table);

    var legPositions = [[-280,40,220],[280,40,220],[-280,40,780],[280,40,780]];
    legPositions.forEach(pos => {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(40, 300, 40), material);
        leg.position.set(...pos);
        window.scene.add(leg);
    });
}

function drawWall(){
    // var Textureloader = new THREE.TextureLoader();
    // var WallTexture = Textureloader.load('./assets/Wall.png');
    var wall = new THREE.Mesh(
        new THREE.BoxGeometry(2000, 1500, 50),
        new THREE.MeshPhongMaterial({ color: 0xCCCCCC }) // replace with: { map: WallTexture }
    );
    wall.position.set(0, 640, 150);
    window.scene.add(wall);
}

function drawfloor(){
    // var Textureloader = new THREE.TextureLoader();
    // var FloorTexture = Textureloader.load('./assets/Wall.png');
    var floor = new THREE.Mesh(
        new THREE.BoxGeometry(2000, 50, 2000),
        new THREE.MeshPhongMaterial({ color: 0x999999 }) // replace with: { map: FloorTexture }
    );
    floor.position.set(0, -135, 1125);
    window.scene.add(floor);
}

//serre draw
function drawSerreFloor(){
    var floor = new THREE.Mesh(
        new THREE.BoxGeometry(380, 10, 200),
        new THREE.MeshPhongMaterial({ color: 0xB68E65 })
    );
    floor.position.set(0, 222.5, 350);
    window.scene.add(floor);
}


function drawSerreWalls(){

    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
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

function init() {
    var container = document.querySelector('.container');
    var canvasWidth = container.offsetWidth;
    var canvasHeight = 700;
    var canvasRatio = canvasWidth / canvasHeight;

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor( 0x999999, 1.0 );

    camera = new THREE.PerspectiveCamera( 30, canvasRatio, 1, 10000 );
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
    container.appendChild( renderer.domElement );
}

function animate() {
    window.requestAnimationFrame(animate);
    render();
}

function render() {
    var delta = clock.getDelta();
    cameraControls.update(delta);
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