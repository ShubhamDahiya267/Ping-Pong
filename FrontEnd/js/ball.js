export default class Ball {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.dx= Math.random() < 0.5 ? 0.80 : -0.80,
        this.dy= Math.random() < 0.5 ? 0.5 : -0.5
    }

    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}