// Get the canvas from the HTML
const canvas = document.getElementById("reptileCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size to match window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();

// Re-adjust canvas on window resize
window.addEventListener("resize", resizeCanvas);

// Particle class for animation (unchanged)
class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = Math.random() * 1.5 - 0.75;
    this.vy = Math.random() * 1.5 - 0.75;
    this.radius = Math.random() * 2 + 1;
    this.color = this.randomColor();
  }

  randomColor() {
    const colors = ["#0ff", "#0f0", "#f0f", "#ff0", "#00f", "#f00"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off edges
    if (this.x <= 0 || this.x >= canvas.width) this.vx *= -1;
    if (this.y <= 0 || this.y >= canvas.height) this.vy *= -1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.fill();
  }
}

// Create and animate multiple particles
const particles = [];
const numParticles = 60;

for (let i = 0; i < numParticles; i++) {
  particles.push(new Particle());
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let particle of particles) {
    particle.update();
    particle.draw();
  }

  requestAnimationFrame(animateParticles);
}

animateParticles();

// Input handling (unchanged)
var Input = {
  keys: [],
  mouse: {
    left: false,
    right: false,
    middle: false,
    x: 0,
    y: 0
  }
};
for (var i = 0; i < 230; i++) {
  Input.keys.push(false);
}
document.addEventListener("keydown", function(event) {
  Input.keys[event.keyCode] = true;
});
document.addEventListener("keyup", function(event) {
  Input.keys[event.keyCode] = false;
});
document.addEventListener("mousedown", function(event) {
  if (event.button === 0) Input.mouse.left = true;
  if (event.button === 1) Input.mouse.middle = true;
  if (event.button === 2) Input.mouse.right = true;
});
document.addEventListener("mouseup", function(event) {
  if (event.button === 0) Input.mouse.left = false;
  if (event.button === 1) Input.mouse.middle = false;
  if (event.button === 2) Input.mouse.right = false;
});
document.addEventListener("mousemove", function(event) {
  Input.mouse.x = event.clientX;
  Input.mouse.y = event.clientY;
});

// Canvas setup (modified)
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
document.body.style.overflow = "hidden";
ctx.strokeStyle = "white"; // Ensure stroke is visible

// Rest of your classes (Segment, LimbSystem, LegSystem, Creature) remain unchanged
// ...

// Initialize the lizard
var critter;
function setupLizard(size, legs, tail) {
  var s = size;
  critter = new Creature(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0,
    s * 10,
    s * 2,
    0.5,
    16,
    0.5,
    0.085,
    0.5,
    0.3
  );
  var spinal = critter;
  // Neck
  for (var i = 0; i < 6; i++) {
    spinal = new Segment(spinal, s * 4, 0, 3.1415 * 2 / 3, 1.1);
    for (var ii = -1; ii <= 1; ii += 2) {
      var node = new Segment(spinal, s * 3, ii, 0.1, 2);
      for (var iii = 0; iii < 3; iii++) {
        node = new Segment(node, s * 0.1, -ii * 0.1, 0.1, 2);
      }
    }
  }
  // Torso and legs
  for (var i = 0; i < legs; i++) {
    if (i > 0) {
      for (var ii = 0; ii < 6; ii++) {
        spinal = new Segment(spinal, s * 4, 0, 1.571, 1.5);
        for (var iii = -1; iii <= 1; iii += 2) {
          var node = new Segment(spinal, s * 3, iii * 1.571, 0.1, 1.5);
          for (var iv = 0; iv < 3; iv++) {
            node = new Segment(node, s * 3, -iii * 0.3, 0.1, 2);
          }
        }
      }
    }
    for (var ii = -1; ii <= 1; ii += 2) {
      var node = new Segment(spinal, s * 12, ii * 0.785, 0, 8); // Hip
      node = new Segment(node, s * 16, -ii * 0.785, 6.28, 1); // Humerus
      node = new Segment(node, s * 16, ii * 1.571, 3.1415, 2); // Forearm
      for (var iii = 0; iii < 4; iii++) {
        new Segment(node, s * 4, (iii / 3 - 0.5) * 1.571, 0.1, 4);
      }
      new LegSystem(node, 3, s * 12, critter, 4);
    }
  }
  // Tail
  for (var i = 0; i < tail; i++) {
    spinal = new Segment(spinal, s * 4, 0, 3.1415 * 2 / 3, 1.1);
    for (var ii = -1; ii <= 1; ii += 2) {
      var node = new Segment(spinal, s * 3, ii, 0.1, 2);
      for (var iii = 0; iii < 3; iii++) {
        node = new Segment(node, s * 3 * (tail - i) / tail, -ii * 0.1, 0.1, 2);
      }
    }
  }
  setInterval(function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    critter.follow(Input.mouse.x, Input.mouse.y);
    // Draw particles after the lizard to ensure they appear in the background
    for (let particle of particles) {
      particle.update();
      particle.draw();
    }
  }, 33);
}

// Set up the lizard with random legs and tail
var legNum = Math.floor(1 + Math.random() * 12);
setupLizard(
  8 / Math.sqrt(legNum),
  legNum,
  Math.floor(4 + Math.random() * legNum * 8)
);
