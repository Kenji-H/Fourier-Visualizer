/*
 * GUIメイン
 */
var N = 16;
var WIDTH;
var HEIGHT;
var MEASURE_LEN=10;
var MARGIN=10;
var SAMPLING_EPS=3;

// スペクトル描写色（k成分とN-k成分は同色にする）
var COLOR= new Array('red','gold','darkorange','darkgreen','lightblue','blue',
                     'purple','dimgray','black','dimgray','purple','blue','lightblue',
                      'darkgreen','darkorange','gold');
var canvas;
var mouseX;
var mouseY;
var plotX;
var plotY;
var ctx;
var pencil;
var mode;                  // 表示モード true: wave-amplitude, false: frequency spectrum

var waveA;
var waveA_t;
var waveK;
var waveAlpha;
var waveAlpha_t;

var flgDrawed;             // 波形入力済みフラグ
var flgSampling;           // サンプリングボタン押下済みフラグ
var flgDFT;                // DFT完了済みフラグ

/*
 * ページロード時の初期化処理
 */
function initEnv() {
	var i;
	
	// 共用変数の初期値設定
	canvas = document.getElementById('cvs_graph');
	WIDTH = canvas.width;
    HEIGHT = canvas.height;

	pencil = false;
	mode = true;
	
	plotX = new Array(N);
	plotY = new Array(N);
	waveA = new Array(N);
	waveA_t = new Array(N);
	waveK = new Array(N);
	waveAlpha = new Array(N);
	waveAlpha_t = new Array(N);
	for (i = 0; i < N; i++) {
		plotX[i] = 0;
		plotY[i] = 0;
		waveA[i] = 0;
		waveA_t[i] = 0;
		waveK[i] = 0;
		waveAlpha[i] = 0;
		waveAlpha_t[i] = 0;
	}
	flgDrawed = false;
	flgSampling = false;
	flgDFT = false;

	// イベントリスナーの設定
	canvas.onmouseover=drawWaveByHand;
    canvas.onmousemove=drawWaveByHand;
	canvas.onmousedown=activePencil;
	canvas.onmouseup=inactivePencil;
    canvas.onmouseout=inactivePencil;
	document.getElementById('bt_wave_mode').onclick=redrawWave;
	document.getElementById('bt_spectrum_mode').onclick=redrawSpectrum;
    document.getElementById('bt_resetcanvas').onclick=clearData;
	document.getElementById('bt_sampling').onclick=doSampling;
	document.getElementById('bt_dft').onclick=doDFT;
	document.getElementById('bt_resetrange').onclick=resetRange;
	document.getElementById('bt_setf0').onclick=minAmplitudes;
	document.getElementById('bt_sett0').onclick=minPhases;
	
	// 振幅スライダー
	for (i = 0; i < N; i++) {
		name='f' + i + '_filter';
		var elms = document.getElementsByName(name);
					
		if (elms) {
			elms.item(0).onchange=(function(pos,obj) {
				return function() {
					doFFiltering(pos,obj);
				}
			})(i, elms.item(0));
		}
	}
	
	// 位相スライダー
	for (i = 0; i < N; i++) {
		name='t' + i + '_filter';
		var elms = document.getElementsByName(name);
					
		if (elms) {
			elms.item(0).onchange=(function(pos,obj) {
				return function() {
					doTFiltering(pos,obj);
				}
			})(i, elms.item(0));
		}
	}

	// キャンバスのコンテキスト取得および座標軸描画
    if (canvas.getContext) {
    	ctx = canvas.getContext('2d');
		drawAxis();
    }
}

/*
 * 表示モードにあわせて画面を再描画
 */
function redraw() {
	if (mode)
		redrawWave();
	else
		redrawSpectrum();
}

/*
 * Wave-Amplitudeの描画
 */
function redrawWave() {
	if (!flgDFT) {
		alert('You cannot see the wave-amplitude graph before processing the DFT.');
		return;
	}
	
	mode = true;
	var i, k;

	initCanvas();
	
	// 入力データ描画
	for (i = 1; i < N; i++)
		drawLine(ctx, "red", plotX[i-1], HEIGHT/2-plotY[i-1], plotX[i], HEIGHT/2-plotY[i]);

	// データ注釈
	writeString(ctx, "red", "16px 'Arial'", "- input wave", 10, 25);
	writeString(ctx, "blue", "16px 'Arial'", "- output wave based on DFT(filtered)", 10, 40);
	
	// 波形の重ね合わせ
	var yt = new Array(N);
	for (i = 0; i < N; i++) {
		yt[i] = 0;
		for (k = 0; k < N; k++)
			yt[i] += waveA_t[k] * Math.cos(waveK[k] * i + waveAlpha_t[k]);
	}

	// DFTに基づく波形描画
	for (i = 1; i < N; i++)
		drawLine(ctx, "blue", plotX[i-1], HEIGHT/2-yt[i-1], plotX[i], HEIGHT/2-yt[i]);
}

/*
 * 周波数スペクトラムの描画
 */
function redrawSpectrum() {
	if (!flgDFT) {
		alert('You cannot see the frequency spectrum before processing the DFT.');
		return;
	}
	
	mode = false;

	var i;
	var r, x, y;
	
	ctx.clearRect(0,0,WIDTH,HEIGHT);
	
	// 座標軸の描画
	drawLine(ctx, "black", 0+100, HEIGHT/2, WIDTH-100, HEIGHT/2);
	drawLine(ctx, "black", WIDTH/2, 0, WIDTH/2, HEIGHT);
	strokeCircle(ctx, "black", WIDTH/2, HEIGHT/2, 250);

	// データ注釈表示
	for (i = 0; i < N; i++)
		writeString(ctx, COLOR[i], "bold 16px 'Arial'", "- F["+i+"]", 10, 35+30*(i+1));
	
	// スペクトルの最大強度を取得（適切な描画サイズを計算するため）
	var max_value = 0;
	for (i = 0; i < N; i++)
		max_value = Math.max(max_value, waveA_t[i]);
	
	// 各スペクトルを極座標系に表示
	for (i = 0; i < N; i++) {
		r = waveA_t[i] / max_value * 250;
	
		x = r * Math.cos(waveAlpha_t[i]);
		y = r * Math.sin(waveAlpha_t[i]);

		fillCircle(ctx, COLOR[i], x + WIDTH/2, HEIGHT/2-y, 5);
		drawLine(ctx, COLOR[i], WIDTH/2, HEIGHT/2, x + WIDTH/2, HEIGHT/2-y);
	}
}

/*
 * キャンバス描画用のペンシルをアクティブ化
 */
function activePencil() {
	pencil = true;
	
	var rect = event.target.getBoundingClientRect();

	mouseX = event.clientX - rect.left;
	mouseY = event.clientY - rect.top;
}

/*
 * キャンバス描画用のペンシルを非アクティブ化
 */
function inactivePencil() {
	pencil = false;
}

/*
 * フリーハンドでの波形描画
 */
function drawWaveByHand() {
    if (!pencil || flgSampling)
		return;
	
	flgDrawed = true;
	
	var rect = event.target.getBoundingClientRect();
			
    var x0 = mouseX;
    var y0 = mouseY;

	mouseX = event.clientX - rect.left;
	mouseY = event.clientY - rect.top;

	var i;
	for (i = 0; i < N; i++) {
		if (Math.abs(plotX[i] - mouseX) < SAMPLING_EPS) {
			plotY[i] = HEIGHT/2 - mouseY;
			break;
		}
	}

	drawLine(ctx, "black", x0, y0, mouseX, mouseY);
}

/*
 * 座標軸の描画
 */
function drawAxis() {
	var i;
	var pos;

	drawLine(ctx, "black", 0, HEIGHT/2, WIDTH, HEIGHT/2);

	for (i = 0; i < N; i++) {
		plotX[i] = MARGIN + (WIDTH - 2 * MARGIN) / (N-1) * i;		
		drawLine(ctx, "black", plotX[i], HEIGHT/2-MEASURE_LEN, plotX[i], HEIGHT/2+MEASURE_LEN);
	}
}

/*
 * キャンバスの内容をクリア
 */
function initCanvas() {
	ctx.clearRect(0,0,WIDTH,HEIGHT);
	drawAxis();
}

/*
 * キャンバスの内容、波形、スペクトルデータの削除
 */
function clearData() {
	var i;
	
	flgDrawed = false;
	flgSampling = false;
	flgDFT = false;
	for (i = 0; i < N; i++) {
		plotY[i] = 0;
		waveA[i] = 0;
		waveA_t[i] = 0;
		waveK[i] = 0;
		waveAlpha[i] = 0;
		waveAlpha_t[i] = 0;
		
		setSliderMid(document.getElementsByName('f'+i+'_filter').item(0));
		setSliderMid(document.getElementsByName('t'+i+'_filter').item(0));
		document.getElementById("lb_f"+i).innerHTML = 'F['+i+'] = (---,---)';
	}
	
	initCanvas();
}

/*
 * データをN区間でサンプリング
 */
function doSampling() {
	if (!flgDrawed) {
		alert('Draw the graph on the canvas first. Put the mouse pointer on the canvas, and drag it.');
		return;
	}
	
	if (flgSampling) {
		alert("You've already done the sampling. If you want to try another wave, RESET the canvas first.");
		return;
	}
	
	var i;

	flgSampling = true;
	for (i = 0; i < N; i++)
		fillCircle(ctx, "red", plotX[i], HEIGHT/2-plotY[i], 5);
	for (i = 1; i < N; i++)
		drawLine(ctx, "red", plotX[i-1], HEIGHT/2-plotY[i-1], plotX[i], HEIGHT/2-plotY[i]);
}

/*
 * DFT処理実行
 */
function doDFT() {
	var i;
	
	if (!flgSampling) {
		alert("Do the sampling before the DFT!");
		return;
	}
	
	if (flgDFT) {
		alert("You've already done the DFT. If you want to try another wave, RESET the canvas first.");
		return;
	}
	
	
	flgDFT = true;
	var F_T = dft(plotY);
	
	// DFTの結果をAltitude/周波数/位相に変換し、グローバル変数に格納
	for (i = 0; i < N; i++) {
		waveA[i] = F_T[i].abs() / N;
		waveA_t[i] = waveA[i];
		waveK[i] = 2 * Math.PI / N * i;
		waveAlpha[i] = F_T[i].arg();
		waveAlpha_t[i] = waveAlpha[i];
	}

	redraw();
	
	// スライダーの位置を設定
	for (i = 0; i < N; i++) {
		updateWaveInfo(i);
		document.getElementsByName('f'+i+'_filter').item(0).value = waveA_t[i];
		document.getElementsByName('t'+i+'_filter').item(0).value = waveAlpha_t[i] / (2 * Math.PI) * 360;
	}
}

/*
 * スライダーのリセット
 */
function resetRange() {
	if (!flgDFT) {
		alert('You cannot use the filtering feature before processing the DFT.');
		return;
	}
	
	var name;

	var i;
	for (i = 0; i < N; i++) {
		waveA_t[i] = waveA[i];
		waveAlpha_t[i] = waveAlpha[i];
		
		document.getElementsByName('f'+i+'_filter').item(0).value = waveA_t[i];
		document.getElementsByName('t'+i+'_filter').item(0).value = waveAlpha_t[i] / (2 * Math.PI) * 360;
	}
	
	redraw();
}

/*
 * スライダーの位置を中央にする
 */
function setSliderMid(obj) {
	obj.value = (parseInt(obj.min) + parseInt(obj.max)) / 2;
}


/*
 * 各成分波の振幅をゼロにする
 */
function minAmplitudes() {
	if (!flgDFT) {
		alert('You cannot use the filtering feature before processing the DFT.');
		return;
	}

	var i;
	
	for (i = 0; i < N; i++) {
		waveA_t[i] = 0;
		document.getElementsByName('f'+i+'_filter').item(0).value = 0;
	}
	
	redraw();
}

/*
 * 各成分波の位相をゼロにする
 */
function minPhases() {
	if (!flgDFT) {
		alert('You cannot use the filtering feature before processing the DFT.');
		return;
	}

	var i;
	
	for (i = 0; i < N; i++) {
		waveAlpha_t[i] = 0;
		document.getElementsByName('t'+i+'_filter').item(0).value = 0;
	}

	redraw();
}
 

/*
 * 振幅フィルタリング処理実行
 */
function doFFiltering(p, obj) {
	if (!flgDFT) {
		setSliderMid(obj);
		return;
	}
	
	waveA_t[p] = parseInt(obj.value);
	updateWaveInfo(p);
	
	redraw();
}

/*
 * 位相変換処理実行
 */
function doTFiltering(p, obj) {
	if (!flgDFT) {
		setSliderMid(obj);
		return;
	}
	
	theta = obj.value / 360 * 2 * Math.PI;
	waveAlpha_t[p] = theta;
	updateWaveInfo(p);
	
	redraw();
}

/*
 * ラベル欄に表示される単位波の振幅、位相を更新
 */
function updateWaveInfo(pos) {
	var r = Math.round(waveA_t[pos]);	
	var theta = Math.round(waveAlpha_t[pos] / (2 * Math.PI) * 360);
	
	document.getElementById("lb_f"+pos).innerHTML = 'F['+pos+'] = ('+r+','+theta+')';
}
