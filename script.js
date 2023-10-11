var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
c.height = window.innerHeight;
c.width = window.innerWidth;
//initialize window
var sinTheta = Math.sin(-.03);
var cosTheta = Math.cos(-.03);
var lineColor = '#000'
var backgroundColor = '#FFF'
var rotationEnabled = true;
var halfheight = c.height / 2
var halfwidth = c.width / 2
//precompute common calculations
ctx.fillStyle = backgroundColor;
ctx.strokeStyle = lineColor;
ctx.translate(c.width / 2,c.height / 2)
//set up canvas, put 0,0 in center
var pointsCorrected = []
var points = []
var depthFactor = 450
loadNewOBJ('DemoModels/monkey.js', onOBJLoaded);
console.log(points)
pointsCorrected = []
var points2d = []
var Zvariation = []

function renderPoints() {
  ctx.beginPath();

  for (let i = 0; i < pointsCorrected.length; i++) {
    const faceVertices = pointsCorrected[i];
    const [x, y] = faceVertices[0];
    ctx.moveTo(x, -y);
    
    for (let o = 1; o < faceVertices.length; o++) {
      const [x, y] = faceVertices[o];
      ctx.lineTo(x, -y);
    }
    //connect first and last vertex
    const [firstX, firstY] = faceVertices[0];
    ctx.lineTo(firstX, -firstY);
  }

  ctx.stroke();
}


function get2DPoints() {
  for (let q = 0; q < points.length; q++) {
    pointsCorrected[q] = []; // Initialize the sub-array
    
    for (let w = 0; w < points[q].length; w++) {
      // Apply perspective projection
      const perspectiveFactor = depthFactor / (depthFactor + points[q][w][2]);
      pointsCorrected[q][w] = [
        points[q][w][0] / perspectiveFactor,
        points[q][w][1] / perspectiveFactor,
      ];
    }
  }
  
}


window.addEventListener('resize', function(event) {
  c.height = window.innerHeight;
  c.width = window.innerWidth;
  halfheight = c.height / 2
  halfwidth = c.width / 2
  ctx.translate(halfwidth, halfheight); // Reapply the translation
  ctx.fillStyle = backgroundColor;
  ctx.strokeStyle = lineColor;
});


function clearScreen() {
  ctx.fillRect(-halfwidth, -halfheight, c.width, c.height);
}


//----------------------------
function update() {
 clearScreen();
 pointsCorrected = []
 get2DPoints();
 renderPoints();
 rotation();
if (rotationEnabled) {
 requestAnimationFrame(update);  
}
}
//----------------------------
requestAnimationFrame(update);
function rotation() {
  const sinTheta = Math.sin(-0.03);
  const cosTheta = Math.cos(-0.03);
  const rotatedPoints = new Array(points.length);

  for (let r = 0; r < points.length; r++) {
    const rotatedFace = new Array(points[r].length);

    for (let t = 0; t < points[r].length; t++) {
      const x = points[r][t][0];
      const y = points[r][t][1];
      const z = points[r][t][2];

      rotatedFace[t] = [
        x * cosTheta - z * sinTheta,
        y,
        z * cosTheta + x * sinTheta
      ];
    }

    rotatedPoints[r] = rotatedFace;
  }

  points = rotatedPoints;
}



function parseOBJ(objString, scale = 1.0) {
  const lines = objString.trim().split('\n');
  let vertices = [];
  let faces = [];

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    const type = parts[0];

    if (type === 'v') {
      const x = parseFloat(parts[1]) * scale;
      const y = parseFloat(parts[2]) * scale;
      const z = parseFloat(parts[3]) * scale;
      vertices.push([x, y, z]);
    } else if (type === 'f') {
      const faceVertices = [];
      for (let i = 1; i < parts.length; i++) {
        const vertexIndex = parseInt(parts[i].split('/')[0]) - 1;
        faceVertices.push(vertexIndex);
      }
      faces.push(faceVertices);
    }
  });

  // Convert face indices to actual vertices
  points = faces.map(faceVertices => faceVertices.map(vertexIndex => vertices[vertexIndex]));

  // Log the parsed points array for verification
  console.log(points);
  printVerticeCount();
}


// Keydown event for switching between built in models or importing objs
//could  be implemented better but dont really care as it only happens once per key press
document.addEventListener('keydown', function(event) {
  if (document.activeElement && document.activeElement.tagName.toLowerCase() !== 'input') {
    switch (event.key) {
      case '1':
        loadNewOBJ('DemoModels/monkey.js', onOBJLoaded);
        break;
      case '2':
        loadNewOBJ('DemoModels/car.js', onOBJLoaded);
        break;
      case '3':
        loadNewOBJ('DemoModels/cow.js', onOBJLoaded);
        break;
      case '4':
        loadNewOBJ('DemoModels/goose.js', onOBJLoaded);
        break;
      case 'i':
        //prompts to import
        importObjPrompt();
        break;
      case 'o':
        //scale existing object
        scaleExistingPoints();
        break;
      case 'p':
        var input = prompt("Please input how you want to transform the model starting with the axis, and then the number of units. Example: 1,3 (x axis, 3 units down)");
        var modelTransforms = input.split(',').map(parseFloat);
        moveModel(modelTransforms[0] - 1
        , modelTransforms[1]);
  
    }
  }

});


//Loads .obj renamed as .js file due to security limitations with local browsers
//To prepare .obj for importing you must make a variable called "ObjData" and then put the actual .obj data inside.
//You should also add a "NewdepthFactor" variable, as some larger models have issues.
//Most models are much smaller than what this program uses, so you must scale them up.
function loadNewOBJ(url, callback) {
  var existingScript = document.querySelector('script[src="' + url + '"]');
  
  if (existingScript) {
    // Remove the existing script element
    existingScript.parentNode.removeChild(existingScript);
  }
  var script = document.createElement('script');
  script.src = url;
  script.onload = callback;
  document.head.appendChild(script);
}


function onOBJLoaded() {
  parseOBJ(ObjData);
  calculateDepthFactor();
}

function moveModel(axis, distance) {
  const translationMatrix = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];

  translationMatrix[axis][3] = distance;

  for (let q = 0; q < points.length; q++) {
    for (let w = 0; w < points[q].length; w++) {
      const [x, y, z] = points[q][w];
      const transformed = matrixMultiplyVector(translationMatrix, [x, y, z, 1]);
      points[q][w] = transformed.slice(0, 3);
    }
  }
}

// Helper function to multiply a matrix by a vector
function matrixMultiplyVector(matrix, vector) {
  const result = [];
  for (let i = 0; i < matrix.length; i++) {
    let sum = 0;
    for (let j = 0; j < vector.length; j++) {
      sum += matrix[i][j] * vector[j];
    }
    result.push(sum);
  }
  return result;
}

// Example usage: Move the model along the X-axis by 10 units
//moveModel(0, 10);



function scaleExistingPoints() {
  var scaleFactor = 1.0
  scaleFactor = parseFloat(prompt('Enter scale factor (Your model may be too small):', '1.0'));
  if (isNaN(scaleFactor)) {
    scaleFactor = 1.0
  }
  for(let qw = 0; qw < points.length; qw++) {
   for(let qe = 0; qe < points[qw].length;qe++) {
    points[qw][qe][0] *= scaleFactor
    points[qw][qe][1] *= scaleFactor
    points[qw][qe][2] *= scaleFactor
   }
  }
  depthFactor *= scaleFactor
}

function calculateDepthFactor(){
  // Calculate the maximum distance from the center for all vertices
  let maxDistance = 0;
  for (const faceVertices of points) {
    for (const vertex of faceVertices) {
      const distance = Math.sqrt(vertex[0] ** 2 + vertex[1] ** 2 + vertex[2] ** 2);
      maxDistance = Math.max(maxDistance, distance);
    }
  }

  // Set depthFactor based on the calculated maximum distance with a safety margin
  const safetyMargin = 2.7; // Adjust this factor as needed
  depthFactor = maxDistance * safetyMargin;
  console.log('Calculated depthFactor:', depthFactor);
}

//Importing .obj's -----------------------------------------------------------

function importObjPrompt() {
  // Create an input element of type "file"
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.obj'; // Limit to .obj files
  fileInput.multiple = false; // Allow only one file selection

  // Append the input element to the document body
  document.body.appendChild(fileInput);

  fileInput.click()

  // Listen for the 'change' event on the input element
  fileInput.addEventListener('change', function() {
    const selectedFile = fileInput.files[0];
    if (!selectedFile) {
      console.log('No file selected.');
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = function(event) {
      const fileContent = event.target.result;
      console.log('File content:', fileContent);
      handleImportedFile(fileContent)
    };

    var importedFile = fileReader.readAsText(selectedFile)
    console.log(importedFile)
  });
}

function handleImportedFile(obj) {
    // Use alert to prompt the user for a scale factor
  var scaleFactor = 1.0 
  scaleFactor = parseFloat(prompt('Enter scale factor (Your model may be too small):', '1.0'));
  console.log(scaleFactor)
  if (isNaN(scaleFactor)) {
    scaleFactor = 1.0
  }
  parseOBJ(obj, scaleFactor);
  calculateDepthFactor();
}



function printVerticeCount() {
  var count = 0
  for(let verticecount1 = 0; verticecount1 < points.length; verticecount1++) {
    for (let verticecount2 = 0; verticecount2 < points[verticecount1].length; verticecount2++) {
     count += 1
    }
  }
  console.log(count + " Vertices")
}

function changeColor() {
  lineColor = document.getElementById("color").value;
  ctx.strokeStyle = lineColor
  if (rotationEnabled == false) {
    requestAnimationFrame(update); 
  }
}
function changeBackground() {
  backgroundColor =  document.getElementById("background").value;
  ctx.fillStyle = backgroundColor
  if (rotationEnabled == false) {
   requestAnimationFrame(update);  
  }
}
function ResetValues() {
  lineColor = '#000'
  backgroundColor = '#FFFFFF'
  ctx.strokeStyle = lineColor
  ctx.fillStyle = backgroundColor
  document.getElementById("color").value = lineColor;
  document.getElementById("background").value = backgroundColor;
  saveColor();
}
function change() {
  rotationEnabled = document.getElementById("toggleupdates").checked;
  if (rotationEnabled) {
    requestAnimationFrame(update);  
  }
}