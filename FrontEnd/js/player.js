export default class Player {
    constructor(x, y, width, height, color) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.color = color
        this.score = 0
    }

    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.fillRect(this.x, this.y, this.width, this.height)

        // draw score
        ctx.font = "20px Arial"
        ctx.fillText(this.score, this.x < 700 ? 620 - ((this.score.toString().length - 1) * 12) : 760, 70)

        ctx.fillRect(this.x < 700 ? 1390 : 0, 0, 10, 800)
    }
}