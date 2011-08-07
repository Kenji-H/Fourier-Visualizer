/*
 * キャンバス関連ライブラリ
 */

/*
 * キャンバスにテキストを書く
 */
function writeString(ctx, color, font, str, x, y) {
	ctx.font = font;
	ctx.fillStyle = color;
	ctx.fillText(str, x, y);
	ctx.fillStyle = "black";
}

/*
 * キャンバスに線を書く
 */
function drawLine(ctx, color, x1, y1, x2, y2) {
	ctx.strokeStyle = color;
	
	ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
	ctx.closePath();
    ctx.stroke();
    
	ctx.strokeStyle = "black";
}

/*
 * キャンバスに円（塗りつぶし）を書く
 */
function fillCircle(ctx, color, x, y, r) {
	ctx.fillStyle = color;

	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
	
	ctx.fillStyle = "black";
}

/*
 * キャンバスに円（塗りつぶしなし）を書く
 */
function strokeCircle(ctx, color, x, y, r) {
	ctx.strokeStyle = color;
	
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2*Math.PI, true);
    ctx.closePath();
	ctx.stroke();

	ctx.strokeStyle = "black";
}
