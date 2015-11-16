// Create the physics world
var world = new p2.World({
  doProfiling : true,
  gravity : [ 0, -10 ],
});

// Set high friction so the wheels don't slip
world.defaultFriction = 100;

var vertices = [[0.0,0.0], [1.0,0.0], [1.0,1.0]]

// Create ground
var planeShape = new p2.Plane();
var planeShape2 = new p2.Rectangle(3,0.1);
var planeShape3 = new p2.Convex(vertices);
var plane = new p2.Body();
plane.addShape(planeShape);
plane.addShape(planeShape2);
plane.addShape(planeShape3);
world.addBody(plane);

// Create chassis
var chassisBody = new p2.Body({
  mass : 1,
  position : [ -4, 1 ]
}), chassisShape = new p2.Rectangle(1, 0.5);
chassisBody.addShape(chassisShape);
world.addBody(chassisBody);

// Create wheels
var wheelShape = new p2.Circle(0.3);

var wheelBody1 = new p2.Body({
  mass : 1,
  position : [ chassisBody.position[0] - 0.5, chassisBody.position[1] - 0.5 ]
});
wheelBody1.addShape(wheelShape);
world.addBody(wheelBody1);

var wheelBody2 = new p2.Body({
  mass : 1,
  position : [ chassisBody.position[0] + 0.5, chassisBody.position[1] - 0.5 ]
});
wheelBody2.addShape(wheelShape);
world.addBody(wheelBody2);


var wheelBody3 = new p2.Body({
  mass : 1,
  position : [ chassisBody.position[0] - 0.5, chassisBody.position[1] + 0.5 ]
});
wheelBody3.addShape(wheelShape);
world.addBody(wheelBody3);


var wheelBody4 = new p2.Body({
  mass : 1,
  position : [ chassisBody.position[0] + 0.5, chassisBody.position[1] + 0.5 ]
});
wheelBody4.addShape(wheelShape);
world.addBody(wheelBody4);

// Disable collisions between chassis and wheels
// Define bits for each shape type
var WHEELS = 1, CHASSIS = 2, GROUND = 4, OTHER = 8;

// Assign groups
wheelShape.collisionGroup = WHEELS;
chassisShape.collisionGroup = CHASSIS;
planeShape.collisionGroup = GROUND;
planeShape2.collisionGroup = GROUND;
planeShape3.collisionGroup = GROUND;

// Wheels can only collide with ground
wheelShape.collisionMask = GROUND | OTHER;

// Chassis can only collide with ground
chassisShape.collisionMask = GROUND | CHASSIS | OTHER;

// Ground can collide with wheels and chassis
planeShape.collisionMask = WHEELS | CHASSIS | OTHER;
planeShape2.collisionMask = WHEELS | CHASSIS | OTHER;
planeShape3.collisionMask = WHEELS | CHASSIS | OTHER;
// Constrain wheels to chassis
var c1 = new p2.PrismaticConstraint(chassisBody, wheelBody1, {
  localAnchorA : [ -0.5, -0.25 ],
  localAnchorB : [ 0, 0 ],
  localAxisA : [ 1, 1 ],
  disableRotationalLock : true,
});
var c2 = new p2.PrismaticConstraint(chassisBody, wheelBody2, {
  localAnchorA : [ 0.5, -0.25 ],
  localAnchorB : [ 0, 0 ],
  localAxisA : [ -1, 1 ],
  disableRotationalLock : true,
});
var c3 = new p2.PrismaticConstraint(chassisBody, wheelBody3, {
  localAnchorA : [ -0.5, 0.25 ],
  localAnchorB : [ 0, 0 ],
  localAxisA : [ 1, -1 ],
  disableRotationalLock : true,
});
var c4 = new p2.PrismaticConstraint(chassisBody, wheelBody4, {
  localAnchorA : [ 0.5, 0.25 ],
  localAnchorB : [ 0, 0 ],
  localAxisA : [ -1, -1 ],
  disableRotationalLock : true,
});
c1.upperLimitEnabled = c2.upperLimitEnabled = c3.upperLimitEnabled = c4.upperLimitEnabled = true;
c1.upperLimit = c2.upperLimit = c3.upperLimit = c4.upperLimit = 0.2;
c1.lowerLimitEnabled = c2.lowerLimitEnabled = c3.lowerLimitEnabled = c4.lowerLimitEnabled = true;
c1.lowerLimit = c2.lowerLimit = c3.lowerLimit = c4.lowerLimit = -0.4;
world.addConstraint(c1);
world.addConstraint(c2);
world.addConstraint(c3);
world.addConstraint(c4);

// Add springs for the suspension
var stiffness = 100, damping = 5, restLength = 0.5;

// Top-Left spring
world.addSpring(new p2.Spring(chassisBody, wheelBody1, {
  restLength : restLength,
  stiffness : stiffness,
  damping : damping,
  localAnchorA : [ -0.5, -0.25 ],
  localAnchorB : [ 0, 0 ],
}));

// Bottom-Right spring
world.addSpring(new p2.Spring(chassisBody, wheelBody2, {
  restLength : restLength,
  stiffness : stiffness,
  damping : damping,
  localAnchorA : [ 0.5, -0.25 ],
  localAnchorB : [ 0, 0 ],
}));

// Top-Left spring
world.addSpring(new p2.Spring(chassisBody, wheelBody3, {
  restLength : restLength,
  stiffness : stiffness,
  damping : damping,
  localAnchorA : [ -0.5, 0.25 ],
  localAnchorB : [ 0, 0 ],
}));

// Top-Right spring
world.addSpring(new p2.Spring(chassisBody, wheelBody4, {
  restLength : restLength,
  stiffness : stiffness,
  damping : damping,
  localAnchorA : [ 0.5, 0.25 ],
  localAnchorB : [ 0, 0 ],
}));

// Apply current engine torque after each step
var torque = 0;
world.on('postStep', function(evt) {
    var max = 100;
    if (wheelBody1.angularVelocity * torque < max)
        wheelBody1.angularForce += torque;
    if (wheelBody2.angularVelocity * torque < max)
        wheelBody2.angularForce += torque;
    if (wheelBody3.angularVelocity * torque < max)
        wheelBody3.angularForce += torque;
    if (wheelBody4.angularVelocity * torque < max)
        wheelBody4.angularForce += torque;
});

world.on('addBody', function(evt) {
  evt.body.setDensity(1);
});

// Change the current engine torque with the left/right keys
window.onkeydown = function(evt) {
  t = 5;
  switch (evt.keyCode) {
  case 39: // right
    torque = -t;
    break;
  case 37: // left
    torque = t;
    break;
  }
};
window.onkeyup = function() {
  torque = 0;
};

Stage(function(stage) {
  stage.viewbox(8, 6).pin('handle', -0.5);
  new Stage.P2(world).appendTo(stage);
});
