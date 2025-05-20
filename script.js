const canvas = document.getElementById("reptileCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Particle class for background effect
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

// Create particles
const particles = [];
const numParticles = 60;
for (let i = 0; i < numParticles; i++) {
  particles.push(new Particle());
}

// Input handling
const Input = {
  mouse: { x: 0, y: 0 }
};
document.addEventListener("mousemove", (event) => {
  Input.mouse.x = event.clientX;
  Input.mouse.y = event.clientY;
});

// Segment class for lizard structure
class Segment {
  constructor(parent, size, angle, range, stiffness) {
    this.parent = parent;
    this.children = [];
    if (Array.isArray(parent.children)) {
      parent.children.push(this);
    }
    this.size = size;
    this.relAngle = angle;
    this.defAngle = angle;
    this.absAngle = parent.absAngle + angle;
    this.range = range;
    this.stiffness = stiffness;
    this.updateRelative(false, true);
  }

  updateRelative(iter, flex) {
    this.relAngle -= 2 * Math.PI * Math.floor((this.relAngle - this.defAngle) / (2 * Math.PI) + 0.5);
    if (flex) {
      this.relAngle = Math.min(
        this.defAngle + this.range / 2,
        Math.max(
          this.defAngle - this.range / 2,
          (this.relAngle - this.defAngle) / this.stiffness + this.defAngle
        )
      );
    }
    this.absAngle = this.parent.absAngle + this.relAngle;
    this.x = this.parent.x + Math.cos(this.absAngle) * this.size;
    this.y = this.parent.y + Math.sin(this.absAngle) * this.size;
    if (iter) {
      for (const child of this.children) {
        child.updateRelative(iter, flex);
      }
    }
  }

  draw(iter) {
    ctx.beginPath();
    ctx.moveTo(this.parent.x, this.parent.y);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    if (iter) {
      for (const child of this.children) {
        child.draw(true);
      }
    }
  }

  follow(iter) {
    const x = this.parent.x;
    const y = this.parent.y;
    const dist = Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
    this.x = x + (this.size * (this.x - x)) / dist;
    this.y = y + (this.size * (this.y - y)) / dist;
    this.absAngle = Math.atan2(this.y - y, this.x - x);
    this.relAngle = this.absAngle - this.parent.absAngle;
    this.updateRelative(false, true);
    if (iter) {
      for (const child of this.children) {
        child.follow(true);
      }
    }
  }
}

// Creature class
class Creature {
  constructor(x, y, angle, fAccel, fFric, fRes, fThresh, rAccel, rFric, rRes, rThresh) {
    this.x = x;
    this.y = y;
    this.absAngle = angle;
    this.fSpeed = 0;
    this.fAccel = fAccel;
    this.fFric = fFric;
    this.fRes = fRes;
    this.fThresh = fThresh;
    this.rSpeed = 0;
    this.rAccel = rAccel;
    this.rFric = rFric;
    this.rRes = rRes;
    this.rThresh = rThresh;
    this.children = [];
  }

  follow(x, y) {
    const dist = Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
    let angle = Math.atan2(y - this.y, x - this.x);
    let accel = this.fAccel;

    // Update forward speed
    this.fSpeed += accel * (dist > this.fThresh);
    this.fSpeed *= 1 - this.fRes;
    this.fSpeed = Math.max(0, this.fSpeed - this.fFric);

    // Update rotation
    let dif = this.absAngle - angle;
    dif -= 2 * Math.PI * Math.floor(dif / (2 * Math.PI) + 0.5);
    if (Math.abs(dif) > this.rThresh && dist > this.fThresh) {
      this.rSpeed -= this.rAccel * (dif > 0 ? 1 : -1);
    }
    this.rSpeed *= 1 - this.rRes;
    if (Math.abs(this.rSpeed) > this.rFric) {
      this.rSpeed -= this.rFric * (this.rSpeed > 0 ? 1 : -1);
    } else {
      this.rSpeed = 0;
    }

    // Update position and angle
    this.absAngle += this.rSpeed;
    this.absAngle -= 2 * Math.PI * Math.floor(this.absAngle / (2 * Math.PI) + 0.5);
    this.x += this.fSpeed * Math.cos(this.absAngle);
    this.y += this.fSpeed * Math.sin(this.absAngle);

    // Follow children
    this.absAngle += Math.PI;
    for (const child of this.children) {
      child.follow(true);
    }
    this.absAngle -= Math.PI;

    // Draw
    this.draw(true);
  }

  draw(iter) {
    const r = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, Math.PI / 4 + this.absAngle, 7 * Math.PI / 4 + this.absAngle);
    ctx.moveTo(this.x + r * Math.cos(7 * Math.PI / 4 + this.absAngle), this.y + r * Math.sin(7 * Math.PI / 4 + this.absAngle));
    ctx.lineTo(this.x + r * Math.cos(this.absAngle) * Math.sqrt(2), this.y + r * Math.sin(this.absAngle) * Math.sqrt(2));
    ctx.lineTo(this.x + r * Math.cos(Math.PI / 4 + this.absAngle), this.y + r * Math.sin(Math.PI / 4 + this.absAngle));
    ctx.stroke();
    if (iter) {
      for (const child of this.children) {
        child.draw(true);
      }
    }
  }
}

// Setup lizard
function setupLizard(size, segments) {
  const critter = new Creature(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0,
    size * 10,
    size * 2,
    0.5,
    16,
    0.5,
    0.085,
    0.5,
    0.3
  );
  let node = critter;
  for (let i = 0; i < segments; i++) {
    node = new Segment(node, size * 4, 0, Math.PI * 2 / 3, 1.1);
  }

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw particles
    for (const particle of particles) {
      particle.update();
      particle.draw();
    }
    // Draw lizard
    critter.follow(Input.mouse.x, Input.mouse.y);
    requestAnimationFrame(animate);
  }
  animate();
}

// Initialize canvas styles
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
document.body.style.overflow = "hidden";
ctx.strokeStyle = "white";
ctx.lineWidth = 2; // Thicker stroke for visibility

// Start lizard with fixed parameters for simplicity
setupLizard(2, 20); // Smaller size, fewer segments for clarity
