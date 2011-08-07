/*
 * —£Uƒt[ƒŠƒG•ÏŠ·‚ÉŠÖ‚í‚éŠÖ”ŒQ
 */
function iexp(theta) {
	return new Complex(Math.cos(theta), Math.sin(theta));
}

function matrixMultiply(A, x) {
	var N = x.length;
	var ret = new Array(N);

	var i, j;
	for (i = 0; i < N; i++) {
		ret[i] = new Complex(0, 0);
		for (j = 0; j < N; j++)
			ret[i] = Complex.sum(ret[i], Complex.prod(A[i][j], x[j]));
	}

	return ret;
}

function dft(y_t) {
	var N = y_t.length;
	var i, j;

	var f_t = new Array(N);
	for (i = 0; i < N; i++)
		f_t[i] = new Complex(y_t[i], 0);

	Wn = -2 * Math.PI / N;
	var W = new Array(N);
	for (i = 0; i < N; i++) {
		W[i] = new Array(N);
	
		for (j = 0; j < N; j++)
			W[i][j] = iexp(Wn * i * j);
	}
	F_t = matrixMultiply(W, f_t);

	return F_t;
}
			
