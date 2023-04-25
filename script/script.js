import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'https://unpkg.com/three@0.112/examples/jsm/controls/OrbitControls.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.5.0/dist/tween.esm.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x414141);

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.set(2, 2, 8);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );



const loader = new GLTFLoader();
let tank;
var x, y;

// Добавляем источник освещения
var light = new THREE.DirectionalLight(0xffffff, 5, 180);
light.position.set(0, 10, 10);
light.castShadow = true; // разрешаем создавать тень
scene.add(light);

// Создание контроллера орбиты
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 8);

// информация иконок
let iconInformation = [
    {
        url: 'img/landing/bullet/icon_1.svg',
        width: 0.6,
        name: 'button1',
        x: -1.1,
        y: 0.3,
        z: 3,
    },
    {
        url: 'img/landing/bullet/icon_2.svg',
        width: 0.8,
        name: 'button2',
        x: 0,
        y: 1.3,
        z: 0.7,
    },
    {
        url: 'img/landing/bullet/icon_3.svg',
        width: 0.6,
        name: 'button3',
        x: 1.1,
        y: 0.3,
        z: 3,
    }
]

// функция для вывода иконок на сцену
function generateIconsInformation(data){
    data.forEach(m => {
        var loader = new THREE.TextureLoader();
        var texture = loader.load(m.url);
        var icon_geometry = new THREE.PlaneGeometry(m.width, m.width),
            icon_material = new THREE.MeshLambertMaterial({map: texture, transparent: true}),
            icon = new THREE.Mesh(icon_geometry, icon_material);
        icon.name = m.name;
        icon.position.set(m.x, m.y, m.z);
        scene.add(icon)
    })
}

generateIconsInformation(iconInformation)


//загрузка танка
loader.load( 'img/tank/tank.glb', function ( gltf ) {
    tank = gltf.scene;
    scene.add(tank);
    canvas.addEventListener("mousemove", onMouseMove);

    // добавляем тень от танка
    tank.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
        }
    })

    renderer.render(scene, camera);

}, undefined, function ( error ) {
    console.error( error );
} );


$(document).mouseenter(function(event){
    x = event.offsetX;
    y = event.offsetY;
});


var canvas = document.querySelector('body');

// Переменные для хранения предыдущих координат курсора
var previousMousePosition = {
    x: 0,
    y: 0
};

function onMouseMove(event) {

    if(previousMousePosition.x === 0){
         previousMousePosition = {
            x: event.clientX, y: event.clientY
        }
    }
    // Получаем текущие координаты курсора относительно элемента
    var currentMousePosition = {
        x: event.clientX - canvas.offsetLeft,
        y: event.clientY - canvas.offsetTop
    };


    // Вычисляем изменение координат курсора за один кадр
    var deltaMousePosition = {
        x: currentMousePosition.x - previousMousePosition.x,
        y: currentMousePosition.y - previousMousePosition.y
    };

    camera.position.x -= deltaMousePosition.x * 0.003;
    camera.position.y -= deltaMousePosition.y * 0.001;

    previousMousePosition = currentMousePosition;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}


// Создаем объект Raycaster
var raycaster = new THREE.Raycaster();
let clickButton = false;

// Обработчик клика на сцене
function onClick(event) {
    // Получаем координаты клика мыши
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Определяем пересечение луча с моделью
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);

    // Если пересечение было найдено, то вызываем нужную функцию
    if (intersects.length > 0) {

        for (var i = 0; i < intersects.length; i++) {
            var object = intersects[i].object;
            // Проверяем, является ли объект моделью
            if (object instanceof THREE.Mesh) {
                getData(object.name);
            }
        }
    }
}

window.addEventListener("click", onClick);

let initialCoordinates = {
    x: 0,
    y: 0,
    z: 0
}

function getData(id){
    clickButton = !clickButton;

    if(clickButton){
        var cameraPosition = camera.position;

        initialCoordinates = {
            x: cameraPosition.x,
            y: cameraPosition.y,
            z: cameraPosition.z
        }
    }
    if (clickButton){
        fetch(`/core/tank_data_${id}.json`)
            .then((response) => response.json())
            .then((json) => { dataOutput(json)})
            .catch(err => console.error(err));
    }
    else{
        fetch(`/core/tank_data.json`)
            .then((response) => response.json())
            .then((json) => { dataOutput(json)})
            .catch(err => console.error(err));
    }


    if(id === 'button1'){
        clickButton ? animateTank(-3, 1, 5) : animateTank(initialCoordinates.x, initialCoordinates.y, initialCoordinates.z)
    }
    else if(id === 'button2'){
        clickButton ? animateTank(0, 2, 5) :  animateTank(initialCoordinates.x, initialCoordinates.y, initialCoordinates.z)
    }
    else if(id === 'button3'){
        clickButton ? animateTank(3, 1, 5) : animateTank(initialCoordinates.x, initialCoordinates.y, initialCoordinates.z)
    }

    if(!clickButton){
        animateTank(initialCoordinates.x, initialCoordinates.y, initialCoordinates.z)
    }

    function animate() {
        requestAnimationFrame(animate);
        TWEEN.update();
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }
    animate()
    clickButton ? canvas.removeEventListener("mousemove", onMouseMove) :  canvas.addEventListener("mousemove", onMouseMove);
}

function animateTank(x, y, z){
    var tween = new TWEEN.Tween(camera.position)
        .to({x: x, y: y, z: z}, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

    return tween
}

function dataOutput(data){
    let card = document.getElementById('card__characteristic');
    let blockData = card.querySelector('.card__characteristic');
    let blockTitle = card.querySelector('.card__title p')
    blockData.innerHTML = '';
    blockTitle.innerHTML = data.title
    data.data.forEach(m => {
        let div = document.createElement('div');
        div.innerHTML = '<div class="characteristic__block">\n' +
            `                            <p>${m.data_title}</p>\n` +
            `                            <p>${m.data_value}</p>\n` +
            '                        </div>'
        blockData.append(div)
    })
}




function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


window.addEventListener('resize', onWindowResize, false);




var planeGeometry = new THREE.PlaneGeometry(60, 60);
var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x0c0c0c});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true;
plane.rotation.x = -Math.PI / 2;
plane.position.set(0, -0.8, 0)
scene.add(plane);

renderer.shadowMapEnabled = true;
renderer.shadowMapType = THREE.PCFSoftShadowMap

light.shadowMapWidth = 40;
light.shadowMapHeight = 20;
